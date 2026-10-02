// ===== workers/turnstile.js =====
function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

const ALLOWED_HOSTNAMES = ['www.realestate.if.ua', 'realestate.if.ua'];
const MANIFEST_URL = 'https://www.realestate.if.ua/assets/data/form-config.json';
const MANIFEST_TTL_MS = 15 * 60 * 1000;

async function loadManifest(env) {
  const cache = caches.default;
  const cached = await cache.match(MANIFEST_URL);
  if (cached) return cached.json();
  const res = await fetch(MANIFEST_URL, { cf: { cacheTtl: MANIFEST_TTL_MS, cacheEverything: true } });
  if (!res.ok) return null;
  const copy = res.clone();
  const manifest = await res.json();
  await cache.put(MANIFEST_URL, copy);
  return manifest;
}

async function verifyTurnstile(token, action, env) {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: false, status: 500, code: 'E_CAPTCHA_UNAVAILABLE', error: 'Captcha verification unavailable' };
  }
  if (typeof token !== 'string' || token.trim() === '') {
    return { ok: false, status: 400, code: 'E_CAPTCHA_REQUIRED', error: 'Captcha required' };
  }

  let outcome;
  try {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    outcome = await verify.json();
  } catch (err) {
    return { ok: false, status: 502, code: 'E_CAPTCHA_UNAVAILABLE', error: 'Captcha service unavailable' };
  }

  // Cloudflare codes: invalid-input-secret (wrong secret), invalid-input-response
  // (token bad, expired or already used), missing-input-response, timeout-or-duplicate.
  const cfErrors = outcome['error-codes'];
  if (!outcome.success) {
    console.log('turnstile rejected', JSON.stringify({ action, hostname: outcome.hostname, errors: cfErrors || null }));
    return {
      ok: false,
      status: 400,
      code: 'E_CAPTCHA_INVALID',
      error: 'Captcha verification failed: ' + (Array.isArray(cfErrors) ? cfErrors.join(',') : 'unknown'),
    };
  }
  if (outcome.action !== action) {
    console.log('turnstile action mismatch', JSON.stringify({ expected: action, got: outcome.action }));
    return { ok: false, status: 400, code: 'E_CAPTCHA_ACTION', error: 'Captcha action mismatch' };
  }
  if (ALLOWED_HOSTNAMES.indexOf(outcome.hostname) === -1) {
    console.log('turnstile hostname mismatch', JSON.stringify({ got: outcome.hostname, allowed: ALLOWED_HOSTNAMES }));
    return { ok: false, status: 400, code: 'E_CAPTCHA_HOSTNAME', error: 'Captcha hostname mismatch' };
  }
  return { ok: true };
}

function siteHostname(request) {
  const origin = (request.headers.get('Origin') || '').trim();
  if (origin) {
    try {
      const host = new URL(origin).hostname.toLowerCase();
      if (ALLOWED_HOSTNAMES.indexOf(host) !== -1) return host;
    } catch (err) {}
  }
  return 'unknown';
}

function checkSpamTraps(payload) {
  if (payload.honeypot) return { ok: false, status: 400, error: 'Spam detected' };
  if (payload.timestamp) {
    const elapsed = Date.now() - parseInt(payload.timestamp, 10);
    if (isNaN(elapsed) || elapsed < 3000 || elapsed > 86400000) {
      return { ok: false, status: 400, error: 'Invalid submission time' };
    }
  }
  return { ok: true };
}

// ===== workers/form-validation.js =====
function sanitize(value) {
  return String(value == null ? '' : value)
    .replace(/<[^>]*>/g, '')
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function matchesValues(dataValue, values, except) {
  const hasValues = Array.isArray(values) && values.length > 0;
  const hasExcept = Array.isArray(except) && except.length > 0;
  if (!hasValues && !hasExcept) return true;

  const listed = (list) =>
    list.some((v) => dataValue === v || String(dataValue) === String(v));

  if (hasValues) {
    const inValues = listed(values);
    if (hasExcept && listed(except)) return false;
    return inValues;
  }
  if (listed(except)) return false;
  return dataValue !== '' && dataValue !== null;
}

function dataGet(data, path) {
  if (!path) return null;
  if (String(path).indexOf('.') === -1) {
    return Object.prototype.hasOwnProperty.call(data, path) ? data[path] : null;
  }
  let cur = data;
  for (const part of String(path).split('.')) {
    if (cur === null || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, part)) {
      return null;
    }
    cur = cur[part];
  }
  return cur;
}

function depValue(data, dep) {
  if (!dep || !dep.field) return null;
  return dataGet(data, dep.field);
}

function matchesValueCondition(dataValue, condition) {
  if (typeof condition === 'number') {
    return !isNaN(parseFloat(dataValue)) && parseFloat(dataValue) === condition;
  }
  if (typeof condition !== 'string') return false;

  const normalized = condition.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
  const m = normalized.match(/^\s*([><=!]+)\s*(\d+\.?\d*)\s*$/);
  if (!m) return false;

  const num = parseFloat(dataValue);
  const op = m[1];
  const val = parseFloat(m[2]);
  if (isNaN(num)) {
    if (op === '>' && val === 0) return dataValue !== '' && dataValue !== null;
    return false;
  }
  switch (op) {
    case '>': return num > val;
    case '>=': return num >= val;
    case '<': return num < val;
    case '<=': return num <= val;
    case '==': return num === val;
    case '!=': return num !== val;
  }
  return false;
}

function checkWhen(when, data) {
  if (!when) return true;
  const dataVal = dataGet(data, when.field);
  if (Array.isArray(when.values) && when.values.length > 0) {
    return when.values.some((v) => dataVal === v || String(dataVal) === String(v));
  }
  if (Object.prototype.hasOwnProperty.call(when, 'value')) {
    return matchesValueCondition(dataVal, when.value);
  }
  return true;
}

function evaluateDepends(deps, data) {
  if (!Array.isArray(deps) || deps.length === 0) return true;
  const mode = deps.some((d) => d && d.logic === 'or') ? 'or' : 'and';

  if (mode === 'or') {
    for (const d of deps) {
      if (!d) continue;
      if (!checkWhen(d.when, data)) continue;
      if (matchesValues(depValue(data, d), d.values, d.except)) return true;
    }
    return false;
  }
  for (const d of deps) {
    if (!d) continue;
    if (!checkWhen(d.when, data)) continue;
    if (!matchesValues(depValue(data, d), d.values, d.except)) return false;
  }
  return true;
}

function isFieldVisible(field, data) {
  return evaluateDepends(field.depends, data);
}

function isFieldRequired(field, data) {
  const r = field.required;
  if (r === true) return true;
  if (Array.isArray(r)) return evaluateDepends(r, data);
  if (isMap(r)) {
    if (Array.isArray(r.depends)) return evaluateDepends(r.depends, data);
    return evaluateDepends(r, data);
  }
  return false;
}

function isEmptyValue(val) {
  return val === '' || val === null || val === undefined || val === false || (Array.isArray(val) && val.length === 0);
}

function isMap(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fieldLabel(field, data) {
  const label = field.label;
  if (typeof label === 'string') return label;
  if (isMap(label)) {
    if (Array.isArray(label.depends)) {
      for (const d of label.depends) {
        if (matchesValues(depValue(data, d), d.values, d.except) && d.text) return d.text;
      }
    }
    if (label.text) return label.text;
  }
  return '';
}

function requiredMessage(field, data, settings) {
  const v = field.validation;
  if (isMap(v) && Object.prototype.hasOwnProperty.call(v, 'required')) {
    const req = v.required;
    if (typeof req === 'string') return req;
    if (isMap(req) && req.text) {
      if (Array.isArray(req.depends)) {
        for (const d of req.depends) {
          if (matchesValues(depValue(data, d), d.values, d.except) && d.text) return d.text;
        }
      }
      return req.text;
    }
  }
  if (typeof field.message === 'string') return field.message;
  if (settings && settings.required && typeof settings.required.message === 'string') {
    return settings.required.message;
  }
  return "Поле обов'язкове";
}

function optionLabel(field, value) {
  const opts = field.options;
  if (Array.isArray(opts)) {
    for (const o of opts) {
      if (o && String(o.value) === String(value)) return o.label != null ? o.label : value;
    }
  }
  return value;
}

function formatValue(field, value) {
  if (typeof value === 'boolean') return value ? 'так' : 'ні';
  if (Array.isArray(value)) return value.map((v) => optionLabel(field, v)).join(', ');
  const type = field.type || '';
  if ((type === 'select' || type === 'radio') && field.options && field.options.length) {
    return optionLabel(field, value);
  }
  return value;
}

function locationVal(data, root, key) {
  if (
    root && data[root] && typeof data[root] === 'object' &&
    Object.prototype.hasOwnProperty.call(data[root], key)
  ) {
    return data[root][key];
  }
  return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
}

function locationDisplay(data, name, root) {
  const id = locationVal(data, root, name);
  const nameVal = locationVal(data, root, name + 'Name');
  if (nameVal === '' || nameVal === null) return id;
  const typeVal = locationVal(data, root, name + 'Type');
  return (typeVal !== '' && typeVal !== null ? typeVal + ' ' : '') + nameVal;
}

function carriesData(field) {
  return ['alert', 'paragraph', 'widgets', 'checkbox', 'file'].indexOf(field.type || '') === -1;
}

function validateManifest(manifest, data) {
  const fields = Array.isArray(manifest.fields) ? manifest.fields : [];
  const settings = manifest.settings || {};
  const locRoot = manifest.locationWidget || 'location_widget';

  const location = {};
  if (Array.isArray(manifest.location)) {
    for (const lc of manifest.location) {
      if (lc && lc.name) location[lc.name] = lc;
    }
  }

  const errors = {};
  for (const field of fields) {
    const name = field.name;
    if (!name) continue;
    if ((field.type || '') === 'file') continue;
    if (!isFieldVisible(field, data)) continue;
    if (!isFieldRequired(field, data)) continue;
    let val = data[name];
    if (field.widget === 'map') val = data.lat ? data.lat : null;
    if (isEmptyValue(val)) errors[name] = requiredMessage(field, data, settings);
  }
  for (const name of Object.keys(location)) {
    if (!isFieldRequired(location[name], data)) continue;
    if (isEmptyValue(locationVal(data, locRoot, name))) {
      errors[name] = requiredMessage(location[name], data, settings);
    }
  }

  return {
    errors,
    fields,
    location,
    settings,
    locRoot,
    isFieldVisible,
    isEmptyValue,
    carriesData,
    fieldLabel,
    formatValue,
    locationVal,
    locationDisplay,
    sanitize,
  };
}

function buildSubmissionBody(manifest, data) {
  const ctx = validateManifest(manifest, data);
  const lines = [];

  for (const field of ctx.fields) {
    if (!field.name) continue;
    if (!ctx.isFieldVisible(field, data)) continue;
    if (!ctx.carriesData(field)) continue;
    const val = data[field.name];
    if (ctx.isEmptyValue(val)) continue;
    const label = ctx.fieldLabel(field, data);
    if (label === '') continue;
    lines.push(label + ': ' + ctx.sanitize(ctx.formatValue(field, val)));
  }
  for (const name of Object.keys(ctx.location)) {
    const val = ctx.locationVal(data, ctx.locRoot, name);
    if (ctx.isEmptyValue(val)) continue;
    const label = ctx.fieldLabel(ctx.location[name], data) || name;
    lines.push(label + ': ' + ctx.sanitize(ctx.locationDisplay(data, name, ctx.locRoot)));
  }
  if (data.lat && data.lng) lines.push('Координати: ' + ctx.sanitize(data.lat) + ', ' + ctx.sanitize(data.lng));
  if (data.address) lines.push('Адреса на карті: ' + ctx.sanitize(data.address));

  const subjectParts = [];
  for (const field of ctx.fields) {
    if (subjectParts.length >= 2) break;
    if (field.type !== 'select' && field.type !== 'radio') continue;
    if (!field.name) continue;
    if (!ctx.isFieldVisible(field, data)) continue;
    const val = data[field.name];
    if (ctx.isEmptyValue(val) || Array.isArray(val)) continue;
    const label = ctx.fieldLabel(field, data);
    if (label === '') continue;
    subjectParts.push(label + ': ' + ctx.formatValue(field, val));
  }
  const subject = subjectParts.length
    ? 'Нове оголошення: ' + subjectParts.join(', ')
    : 'Нове оголошення про нерухомість';

  return { lines, subject, errors: ctx.errors };
}

// ===== workers/add-property-worker.js =====
const MAX_PHOTOS = 4;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024;

async function readPayload(request) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (contentType.indexOf('multipart/form-data') === 0) {
    const form = await request.formData();
    let data = null;
    try {
      data = JSON.parse(form.get('data'));
    } catch (err) {
      data = null;
    }
    const photos = [];
    for (const entry of form.getAll('images')) {
      if (entry && typeof entry.arrayBuffer === 'function') photos.push(entry);
    }
    return { token: form.get('cf-turnstile-response'), data: data, photos: photos };
  }
  const payload = await request.json();
  return {
    token: payload['cf-turnstile-response'],
    data: payload.data,
    photos: Array.isArray(payload.images) ? payload.images : [],
  };
}

async function buildAttachments(photos) {
  if (!photos.length) return { attachments: [] };
  if (photos.length > MAX_PHOTOS) {
    return { error: 'Too many photos', code: 'E_TOO_MANY_ATTACHMENTS', status: 400 };
  }
  const attachments = [];
  let total = 0;
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (photo.type && photo.type.indexOf('image/') !== 0) {
      return { error: 'Invalid file type', code: 'E_ATTACHMENT_TYPE_INVALID', status: 400 };
    }
    const buffer = await photo.arrayBuffer();
    total += buffer.byteLength;
    if (total > MAX_TOTAL_BYTES) {
      return { error: 'Photos are too large', code: 'E_CONTENT_TOO_LARGE', status: 400 };
    }
    attachments.push({
      filename: photo.name || 'photo-' + (i + 1) + '.jpg',
      type: photo.type || 'image/jpeg',
      disposition: 'attachment',
      content: buffer,
    });
  }
  return { attachments: attachments };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed', code: 'E_METHOD' }, 405);
    }

    let payload;
    try {
      payload = await readPayload(request);
    } catch (err) {
      return jsonResponse({ success: false, error: 'Invalid data', code: 'E_INVALID_PAYLOAD' }, 400);
    }

    const turnstile = await verifyTurnstile(payload.token, 'add_property', env);
    if (!turnstile.ok) {
      return jsonResponse({ success: false, error: turnstile.error, code: turnstile.code }, turnstile.status);
    }

    const data = payload.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return jsonResponse({ success: false, error: 'Invalid data', code: 'E_INVALID_PAYLOAD' }, 400);
    }

    const photoResult = await buildAttachments(payload.photos);
    if (photoResult.error) {
      return jsonResponse(
        { success: false, error: photoResult.error, code: photoResult.code },
        photoResult.status
      );
    }
    const attachments = photoResult.attachments;

    const site = siteHostname(request);
    const manifest = await loadManifest(env);
    if (!manifest || !Array.isArray(manifest.fields) || manifest.fields.length === 0) {
      return jsonResponse({ success: false, error: 'Form configuration not found', code: 'E_CONFIG_MISSING' }, 500);
    }

    const { errors } = validateManifest(manifest, data);
    if (errors && Object.keys(errors).length) {
      return jsonResponse({ success: false, errors: errors }, 400);
    }

    const { lines, subject } = buildSubmissionBody(manifest, data);

    const to = env.ADD_PROPERTY_EMAIL || 'info@realestate.if.ua';
    const from = env.MAIL_FROM || 'noreply@send.realestate.if.ua';
    const replyTo = data.email || env.MAIL_REPLY_TO || from;

    const text = [
      'Нове оголошення про нерухомість',
      '===============================',
      '',
      'Сайт: ' + site,
      'Дата: ' + new Date().toISOString().replace('T', ' ').slice(0, 19),
      'Фото: ' + attachments.length,
      '',
      lines.join('\n'),
      '',
      '---',
      'Надіслано через форму додавання оголошення',
    ].join('\n');

    if (!env.EMAIL) {
      return jsonResponse({ success: false, error: 'Mail sending unavailable', code: 'E_MAIL_UNAVAILABLE' }, 500);
    }

    try {
      await env.EMAIL.send({
        to: to,
        from: from,
        replyTo: replyTo,
        subject: '[' + site + '] ' + subject,
        text: text,
        attachments: attachments,
      });
    } catch (err) {
      console.error('Email sending failed:', err && err.code, err && err.message);
      return jsonResponse(
        { success: false, error: 'Failed to send email', code: (err && err.code) || 'E_SEND_FAILED' },
        500
      );
    }

    return jsonResponse({ success: true });
  },
};
