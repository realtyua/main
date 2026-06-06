export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    try {
      const data = await request.json();

      const turnstileSecret = env.TURNSTILE_SECRET_KEY;
      if (turnstileSecret && data['cf-turnstile-response']) {
        const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(data['cf-turnstile-response'])}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const outcome = await verify.json();
        if (!outcome.success) {
          return new Response(JSON.stringify({ error: 'Verification failed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }
      }

      if (data.honeypot) {
        return new Response(JSON.stringify({ error: 'Spam detected' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (data.timestamp) {
        var elapsed = Date.now() - parseInt(data.timestamp, 10);
        if (elapsed < 3000 || elapsed > 86400000) {
          return new Response(JSON.stringify({ error: 'Invalid submission time' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }
      }

      const phpUrl = env.PHP_URL || 'https://add.realestate.if.ua/notify.php';

      const formBody = new URLSearchParams();
      Object.entries(data).forEach(function (_ref) {
        var key = _ref[0];
        var val = _ref[1];
        if (typeof val === 'string') formBody.append(key, val);
      });
      if (env.NOTIFY_EMAIL) formBody.append('notify_email', env.NOTIFY_EMAIL);

      const response = await fetch(phpUrl, {
        method: 'POST',
        body: formBody,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const result = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: result.error || 'Server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};