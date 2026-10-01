<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/turnstile.php';

list($turnstileError, $turnstileErrorCode) = verify_turnstile_request(
    $_POST['cf-turnstile-response'] ?? '',
    'notify_property',
    ['www.realestate.if.ua', 'realestate.if.ua']
);
if ($turnstileError !== null) {
    http_response_code($turnstileErrorCode);
    echo json_encode(['error' => $turnstileError]);
    exit;
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
