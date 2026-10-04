import { jsonResponse, corsHeaders, verifyTurnstile, loadManifest, siteHostname } from './turnstile.js';
import { buildSubmissionBody, validateManifest } from './form-validation.js';

const MAX_PHOTOS = 4;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024;
const DEFAULT_CAPTCHA_ACTION = 'add_property';

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

    const site = siteHostname(request);
    const manifest = await loadManifest(env);
    if (!manifest || !Array.isArray(manifest.fields) || manifest.fields.length === 0) {
      return jsonResponse({ success: false, error: 'Form configuration not found', code: 'E_CONFIG_MISSING' }, 500);
    }

    // Action captcha приїжджає з конфігурації форми (_data/add-property.yml).
    const captchaCfg = manifest.captcha || {};
    const captchaAction = captchaCfg.action || DEFAULT_CAPTCHA_ACTION;

    const turnstile = await verifyTurnstile(payload.token, captchaAction, env);
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