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
  const cfErrors = Array.isArray(outcome['error-codes']) ? outcome['error-codes'] : [];
  if (!outcome.success) {
    // Token length and prefix only: enough to tell an empty field, a stale
    // token and a token issued for another sitekey apart, without logging the
    // token itself.
    const t = String(token);
    console.log('turnstile rejected', JSON.stringify({
      action,
      tokenLen: t.length,
      tokenHead: t.slice(0, 4),
      hasDots: t.split('.').length === 3,
      siteverifyHost: outcome.hostname || null,
      errors: cfErrors.length ? cfErrors : null,
    }));

    // Cloudflare collapses several unrelated problems into
    // invalid-input-response, so map them apart for the caller.
    let code = 'E_CAPTCHA_INVALID';
    if (cfErrors.indexOf('timeout-or-duplicate') !== -1) {
      code = 'E_CAPTCHA_REUSED';
    } else if (cfErrors.indexOf('invalid-input-response') !== -1) {
      code = 'E_CAPTCHA_MALFORMED';
    }

    return {
      ok: false,
      status: 400,
      code,
      error: 'Captcha verification failed: ' + (cfErrors.length ? cfErrors.join(',') : 'unknown'),
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

// ===== workers/notify-worker.js =====
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed', code: 'E_METHOD' }, 405);
    }

    let data;
    try {
      data = await request.json();
    } catch (err) {
      return jsonResponse({ success: false, error: 'Invalid data', code: 'E_INVALID_PAYLOAD' }, 400);
    }

    const turnstile = await verifyTurnstile(data['cf-turnstile-response'], 'notify_property', env);
    if (!turnstile.ok) {
      return jsonResponse({ success: false, error: turnstile.error, code: turnstile.code }, turnstile.status);
    }

    const spam = checkSpamTraps(data);
    if (!spam.ok) {
      return jsonResponse({ success: false, error: spam.error, code: 'E_SPAM' }, spam.status);
    }

    const site = siteHostname(request);
    const reasonText = NOTIFY_REASONS[data.reason] || data.reason || '';

    const to = env.NOTIFY_EMAIL || 'info@realestate.if.ua';

    const from = env.MAIL_FROM || 'noreply@send.realestate.if.ua';
    const replyTo = data.contact_email || env.MAIL_REPLY_TO || from;

    const text = [
      'Повідомлення про неточність',
      '========================',
      '',
      'Сайт: ' + site,
      'URL оголошення: ' + (data.property_url || ''),
      'UID: ' + (data.uid || ''),
      'Email власника: ' + (data.property_email || ''),
      'Причина: ' + reasonText,
      'Деталі: ' + (data.details || ''),
      '',
      'Контакти:',
      "  Ім'я: " + (data.contact_name || ''),
      '  Телефон: ' + (data.contact_phone || ''),
      '  Email: ' + (data.contact_email || ''),
      '',
      '---',
      'Надіслано через форму на сайті',
    ].join('\n');

    const subject = '[' + site + '] Неточність: ' + (data.property_title || data.uid || 'оголошення');

    if (!env.EMAIL) {
      return jsonResponse({ success: false, error: 'Mail sending unavailable', code: 'E_MAIL_UNAVAILABLE' }, 500);
    }

    try {
      await env.EMAIL.send({
        to: to,
        from: from,
        replyTo: replyTo,
        subject: subject,
        text: text,
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

const NOTIFY_REASONS = {
  not_actual: 'Оголошення вже не актуальне (продано/здано)',
  moved_to_archive: 'Помилково переміщено в архів',
  wrong_price: 'Ціна вказана неправильно',
  wrong_info: 'Інформація в описі неточна',
  error: 'Помилка в оголошенні (адреса, контакти тощо)',
  duplicate: 'Дублікат іншого оголошення',
  other: 'Інше',
};
