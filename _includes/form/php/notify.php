<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$turnstileToken = $_POST['cf-turnstile-response'] ?? '';
if ($turnstileToken) {
    $secret = getenv('TURNSTILE_SECRET_KEY') ?: '0x4AAAAAADf6HHL_uIYQWjdoKgygA8Ttv-U';
    $verify = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query([
                'secret' => $secret,
                'response' => $turnstileToken,
            ]),
        ],
    ]));
    $outcome = json_decode($verify, true);
    if (!$outcome['success']) {
        http_response_code(400);
        echo json_encode(['error' => 'Verification failed']);
        exit;
    }
}

$uid = $_POST['uid'] ?? '—';
$propertyUrl = $_POST['property_url'] ?? '—';
$propertyTitle = $_POST['property_title'] ?? '—';
$reason = $_POST['reason'] ?? '—';
$details = $_POST['details'] ?? '';
$contactName = $_POST['contact_name'] ?? '';
$contactPhone = $_POST['contact_phone'] ?? '';
$contactEmail = $_POST['contact_email'] ?? '';

$reasons = [
    'not_actual' => 'Оголошення вже не актуальне (продано/здано)',
    'moved_to_archive' => 'Помилково переміщено в архів',
    'wrong_price' => 'Ціна вказана неправильно',
    'wrong_info' => 'Інформація в описі неточна',
    'error' => 'Помилка в оголошенні (адреса, контакти тощо)',
    'duplicate' => 'Дублікат іншого оголошення',
    'other' => 'Інше',
];
$reasonText = $reasons[$reason] ?? $reason;

$to = $_POST['notify_email'] ?? 'your-email@example.com';
$subject = 'Повідомлення про неточність: ' . $propertyTitle;
$headers = "From: notify@add.realestate.if.ua\r\n";
$headers .= "Reply-To: noreply@add.realestate.if.ua\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$message = "Повідомлення про неточність\n";
$message .= "========================\n\n";
$message .= "URL оголошення: $propertyUrl\n";
$message .= "UID: $uid\n";
$message .= "Причина: $reasonText\n";
$message .= "Деталі: $details\n\n";
$message .= "Контакти:\n";
$message .= "  Ім'я: $contactName\n";
$message .= "  Телефон: $contactPhone\n";
$message .= "  Email: $contactEmail\n\n";
$message .= "---\n";
$message .= "Надіслано через форму на сайті\n";

if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
}
