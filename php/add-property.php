<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
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
        echo json_encode(['success' => false, 'error' => 'Verification failed']);
        exit;
    }
}

$raw = $_POST['data'] ?? '';
$data = json_decode($raw, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

$required = ['type', 'property_type', 'surface', 'price', 'location', 'address', 'seller', 'phone'];
$errors = [];
foreach ($required as $field) {
    if (empty($data[$field]) && $data[$field] !== '0') {
        $errors[$field] = "Поле обов'язкове";
    }
}
if ($data['type'] === 'sell' && empty($data['property_type'])) {
    $errors['property_type'] = "Виберіть вид нерухомості";
}
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

function sanitize($val) {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$type = sanitize($data['type'] ?? '');
$propertyType = sanitize($data['property_type'] ?? '');
$rooms = sanitize($data['rooms'] ?? '');
$surface = sanitize($data['surface'] ?? '');
$surfaceLand = sanitize($data['surface_land'] ?? '');
$floors = sanitize($data['floors'] ?? '');
$floor = sanitize($data['floor'] ?? '');
$parking = sanitize($data['parking'] ?? '');
$price = sanitize($data['price'] ?? '');
$currency = sanitize($data['currency'] ?? '');
$location = sanitize($data['location'] ?? '');
$region = sanitize($data['region'] ?? '');
$address = sanitize($data['address'] ?? '');
$seller = sanitize($data['seller'] ?? '');
$phone = sanitize($data['phone'] ?? '');
$description = sanitize($data['description'] ?? '');

$uploadedFiles = '';
if (!empty($_FILES['images'])) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $fileNames = [];
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $files = $_FILES['images'];
    $fileCount = is_array($files['name']) ? count($files['name']) : 0;
    for ($i = 0; $i < $fileCount && $i < 10; $i++) {
        if (!in_array($files['type'][$i], $allowed)) continue;
        if ($files['size'][$i] > 5 * 1024 * 1024) continue;
        $ext = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
        $newName = uniqid('prop_') . '.' . $ext;
        if (move_uploaded_file($files['tmp_name'][$i], $uploadDir . $newName)) {
            $fileNames[] = $newName;
        }
    }
    if ($fileNames) {
        $uploadedFiles = "\nФайли: " . implode(', ', $fileNames);
    }
}

$typeLabel = $type === 'rent' ? 'Оренда' : 'Продаж';
$date = date('Y-m-d H:i:s');

$to = 'info@realestate.if.ua';
$subject = "Нове оголошення: $typeLabel, $propertyType";
$headers = "From: add-property@realestate.if.ua\r\n";
$headers .= "Reply-To: noreply@realestate.if.ua\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$message = "Нове оголошення про нерухомість\n";
$message .= "===============================\n\n";
$message .= "Дата: $date\n";
$message .= "Тип: $typeLabel\n";
$message .= "Вид: $propertyType\n";
$message .= "Кімнат: $rooms\n";
$message .= "Площа: $surface м²\n";
$message .= "Площа землі: $surfaceLand соток\n";
$message .= "Поверхів: $floors\n";
$message .= "Поверх: $floor\n";
$message .= "Паркування: $parking\n";
$message .= "Ціна: $price $currency\n";
$message .= "Локація: $location\n";
$message .= "Район: $region\n";
$message .= "Адреса: $address\n\n";
$message .= "Продавець: $seller\n";
$message .= "Телефон: $phone\n";
$message .= "Опис: $description\n";
$message .= "$uploadedFiles\n\n";
$message .= "---\n";
$message .= "Надіслано через форму додавання оголошення\n";

if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
}
