<?php

/**
 * Спільна перевірка Cloudflare Turnstile.
 * Секрет береться лише зі змінної оточення TURNSTILE_SECRET_KEY — у репозиторії
 * секретів бути не повинно.
 */

function turnstile_post_siteverify($secret, $token)
{
    $verify = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query([
                'secret' => $secret,
                'response' => $token,
            ]),
            'timeout' => 10,
        ],
    ]));

    if ($verify === false) {
        return null;
    }

    return json_decode($verify, true);
}

/**
 * Повертає [null, 200] коли captcha пройшла, або [повідомлення, код] з помилкою.
 */
function verify_turnstile_request($token, $expectedAction, array $allowedHosts)
{
    $secret = getenv('TURNSTILE_SECRET_KEY');
    if (!$secret) {
        return ['Captcha verification unavailable', 500];
    }

    if (!is_string($token) || trim($token) === '') {
        return ['Captcha required', 400];
    }

    $outcome = turnstile_post_siteverify($secret, trim($token));
    if ($outcome === null) {
        return ['Captcha verification unavailable', 500];
    }

    if (empty($outcome['success'])) {
        return ['Verification failed', 400];
    }

    if (!empty($outcome['error-codes'])) {
        return ['Verification failed', 400];
    }

    if ($expectedAction !== ''
        && (!isset($outcome['action']) || $outcome['action'] !== $expectedAction)) {
        return ['Verification failed', 400];
    }

    if ($allowedHosts
        && (!isset($outcome['hostname']) || !in_array($outcome['hostname'], $allowedHosts, true))) {
        return ['Verification failed', 400];
    }

    return [null, 200];
}