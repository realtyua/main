import { jsonResponse, corsHeaders, verifyTurnstile, checkSpamTraps, siteHostname } from './turnstile.js';

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