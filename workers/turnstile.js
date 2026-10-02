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

export async function loadManifest(env) {
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

export async function verifyTurnstile(token, action, env) {
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

export function siteHostname(request) {
  const origin = (request.headers.get('Origin') || '').trim();
  if (origin) {
    try {
      const host = new URL(origin).hostname.toLowerCase();
      if (ALLOWED_HOSTNAMES.indexOf(host) !== -1) return host;
    } catch (err) {}
  }
  return 'unknown';
}

export function checkSpamTraps(payload) {
  if (payload.honeypot) return { ok: false, status: 400, error: 'Spam detected' };
  if (payload.timestamp) {
    const elapsed = Date.now() - parseInt(payload.timestamp, 10);
    if (isNaN(elapsed) || elapsed < 3000 || elapsed > 86400000) {
      return { ok: false, status: 400, error: 'Invalid submission time' };
    }
  }
  return { ok: true };
}

export { jsonResponse, corsHeaders, ALLOWED_HOSTNAMES };