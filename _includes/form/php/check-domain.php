<?php
header('Content-Type: application/json; charset=utf-8');

$email = isset($_GET['email']) ? trim($_GET['email']) : '';
if (!$email || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    echo json_encode(['valid' => false, 'error' => 'Invalid email']);
    exit;
}

$domain = substr(strrchr($email, '@'), 1);
if (!$domain) {
    echo json_encode(['valid' => false, 'error' => 'Invalid domain']);
    exit;
}

$hasMX = checkdnsrr($domain, 'MX');
$hasA  = checkdnsrr($domain, 'A') || checkdnsrr($domain, 'AAAA');

echo json_encode([
    'valid'  => $hasMX && $hasA,
    'domain' => $domain,
    'hasMX'  => $hasMX,
    'hasA'   => $hasA
]);
