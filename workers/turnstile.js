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
  if (!secret) return { ok: false, status: 500, error: 'Captcha verification unavailable' };
  if (typeof token !== 'string' || token.trim() === '') {
    return { ok: false, status: 400, error: 'Captcha required' };
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
    return { ok: false, status: 502, error: 'Captcha service unavailable' };
  }

  if (!outcome.success) return { ok: false, status: 400, error: 'Captcha verification failed' };
  if (outcome.action !== action) return { ok: false, status: 400, error: 'Captcha action mismatch' };
  if (ALLOWED_HOSTNAMES.indexOf(outcome.hostname) === -1) {
    return { ok: false, status: 400, error: 'Captcha hostname mismatch' };
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