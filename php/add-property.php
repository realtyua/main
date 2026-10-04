<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/turnstile.php';

$manifestPath = __DIR__ . '/../assets/data/form-config.json';
$manifest = [];
if (is_file($manifestPath)) {
    $manifest = json_decode(@file_get_contents($manifestPath), true);
}
if (!is_array($manifest)) $manifest = [];
$captchaConfig = isset($manifest['captcha']) && is_array($manifest['captcha']) ? $manifest['captcha'] : [];
$captchaTokenField = isset($captchaConfig['token']) && is_string($captchaConfig['token']) && $captchaConfig['token'] !== ''
    ? $captchaConfig['token']
    : 'cf-turnstile-response';
// Action captcha приїжджає з конфігурації форми (_data/add-property.yml).
$captchaAction = isset($captchaConfig['action']) && is_string($captchaConfig['action']) && $captchaConfig['action'] !== ''
    ? $captchaConfig['action']
    : 'add_property';

list($turnstileError, $turnstileErrorCode) = verify_turnstile_request(
    $_POST[$captchaTokenField] ?? '',
    $captchaAction,
    ['www.realestate.if.ua', 'realestate.if.ua']
);
if ($turnstileError !== null) {
    http_response_code($turnstileErrorCode);
    echo json_encode(['success' => false, 'error' => $turnstileError]);
    exit;
}

$raw = $_POST['data'] ?? '';
$data = json_decode($raw, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

function sanitize($val) {
    return htmlspecialchars(strip_tags(trim((string)$val)), ENT_QUOTES, 'UTF-8');
}

function matchesValues($dataValue, $values, $except) {
    $hasValues = is_array($values) && count($values) > 0;
    $hasExcept = is_array($except) && count($except) > 0;
    if (!$hasValues && !$hasExcept) return true;
    if ($hasValues) {
        $inValues = false;
        foreach ($values as $v) {
            if ($dataValue === $v || (string)$dataValue === (string)$v) { $inValues = true; break; }
        }
        if ($hasExcept) {
            foreach ($except as $e) {
                if ($dataValue === $e || (string)$dataValue === (string)$e) return false;
            }
            return $inValues;
        }
        return $inValues;
    }
    if ($hasExcept) {
        foreach ($except as $e) {
            if ($dataValue === $e || (string)$dataValue === (string)$e) return false;
        }
        return $dataValue !== '' && $dataValue !== null;
    }
    return false;
}

function dataGet($data, $path) {
    if ($path === null || $path === '') return null;
    if (strpos($path, '.') === false) return isset($data[$path]) ? $data[$path] : null;
    $cur = $data;
    foreach (explode('.', $path) as $part) {
        if (!is_array($cur) || !array_key_exists($part, $cur)) return null;
        $cur = $cur[$part];
    }
    return $cur;
}

function depValue($data, $dep) {
    if (!isset($dep['field'])) return null;
    return dataGet($data, $dep['field']);
}

function matchesValueCondition($dataValue, $condition) {
    if (is_numeric($condition)) return (float)$dataValue === (float)$condition;
    if (!is_string($condition)) return false;
    $condition = str_replace('&gt;', '>', str_replace('&lt;', '<', $condition));
    $m = [];
    if (preg_match('/^\s*([><=!]+)\s*(\d+\.?\d*)\s*$/', $condition, $m)) {
        $num = (float)$dataValue;
        $op = $m[1]; $val = (float)$m[2];
        if (is_nan($num)) {
            if ($op === '>' && $val === 0) return $dataValue !== '' && $dataValue !== null;
            return false;
        }
        switch ($op) {
            case '>':  return $num > $val;
            case '>=': return $num >= $val;
            case '<':  return $num < $val;
            case '<=': return $num <= $val;
            case '==': return $num == $val;
            case '!=': return $num != $val;
        }
    }
    return false;
}

function checkWhen($when, $data) {
    if (!$when) return true;
    $dataVal = dataGet($data, isset($when['field']) ? $when['field'] : null);
    if (isset($when['values']) && is_array($when['values']) && count($when['values']) > 0) {
        foreach ($when['values'] as $v) {
            if ($dataVal === $v || (string)$dataVal === (string)$v) return true;
        }
        return false;
    }
    if (isset($when['value'])) return matchesValueCondition($dataVal, $when['value']);
    return true;
}

function evaluateDepends($deps, $data) {
    if (!is_array($deps) || count($deps) === 0) return true;
    $mode = 'and';
    foreach ($deps as $d) {
        if (isset($d['logic']) && $d['logic'] === 'or') { $mode = 'or'; break; }
    }
    if ($mode === 'or') {
        foreach ($deps as $d) {
            if (!checkWhen(isset($d['when']) ? $d['when'] : null, $data)) continue;
            if (matchesValues(depValue($data, $d), isset($d['values']) ? $d['values'] : [], isset($d['except']) ? $d['except'] : [])) return true;
        }
        return false;
    }
    foreach ($deps as $d) {
        if (!checkWhen(isset($d['when']) ? $d['when'] : null, $data)) continue;
        if (!matchesValues(depValue($data, $d), isset($d['values']) ? $d['values'] : [], isset($d['except']) ? $d['except'] : [])) return false;
    }
    return true;
}

function isFieldVisible($field, $data) {
    $dep = isset($field['depends']) ? $field['depends'] : null;
    if (!is_array($dep) || count($dep) === 0) return true;
    return evaluateDepends($dep, $data);
}

function isFieldRequired($field, $data) {
    $r = isset($field['required']) ? $field['required'] : false;
    if ($r === true) return true;
    if (is_array($r)) {
        if (isset($r['depends']) && is_array($r['depends'])) {
            return evaluateDepends($r['depends'], $data);
        }
        return evaluateDepends($r, $data);
    }
    return false;
}

function isEmptyValue($val) {
    return $val === '' || $val === null || $val === false || (is_array($val) && count($val) === 0);
}

function fieldLabel($field, $data) {
    $label = isset($field['label']) ? $field['label'] : null;
    if (is_string($label)) return $label;
    if (is_array($label)) {
        $dep = isset($label['depends']) ? $label['depends'] : null;
        if (is_array($dep)) {
            foreach ($dep as $d) {
                if (matchesValues(depValue($data, $d), isset($d['values']) ? $d['values'] : [], isset($d['except']) ? $d['except'] : [])) {
                    if (isset($d['text']) && $d['text'] !== '') return $d['text'];
                }
            }
        }
        if (isset($label['text']) && $label['text'] !== '') return $label['text'];
    }
    return '';
}

function requiredMessage($field, $data, $settings) {
    $v = isset($field['validation']) ? $field['validation'] : null;
    if (is_array($v) && isset($v['required'])) {
        $req = $v['required'];
        if (is_string($req)) return $req;
        if (is_array($req) && isset($req['text'])) {
            $text = $req['text'];
            $dep = isset($req['depends']) ? $req['depends'] : null;
            if (is_array($dep)) {
                foreach ($dep as $d) {
                    if (matchesValues(depValue($data, $d), isset($d['values']) ? $d['values'] : [], isset($d['except']) ? $d['except'] : [])) {
                        if (isset($d['text']) && $d['text'] !== '') return $d['text'];
                    }
                }
            }
            return $text;
        }
    }
    if (isset($field['message']) && is_string($field['message'])) return $field['message'];
    if (is_array($settings) && isset($settings['required']['message']) && is_string($settings['required']['message'])) {
        return $settings['required']['message'];
    }
    return "Поле обов'язкове";
}

function optionLabel($field, $value) {
    $opts = isset($field['options']) ? $field['options'] : null;
    if (is_array($opts)) {
        foreach ($opts as $o) {
            if (isset($o['value']) && (string)$o['value'] === (string)$value) {
                return isset($o['label']) ? $o['label'] : $value;
            }
        }
    }
    return $value;
}

function formatValue($field, $value) {
    if (is_bool($value)) return $value ? 'так' : 'ні';
    if (is_array($value)) {
        $parts = [];
        foreach ($value as $v) { $parts[] = optionLabel($field, $v); }
        return implode(', ', $parts);
    }
    $type = isset($field['type']) ? $field['type'] : '';
    if (($type === 'select' || $type === 'radio') && !empty($field['options'])) {
        return optionLabel($field, $value);
    }
    return $value;
}

function locationVal($data, $root, $key) {
    if ($root !== null && $root !== '' && isset($data[$root]) && is_array($data[$root]) && array_key_exists($key, $data[$root])) {
        return $data[$root][$key];
    }
    return isset($data[$key]) ? $data[$key] : null;
}

function locationDisplay($data, $name, $root) {
    $id = locationVal($data, $root, $name);
    $nameKey = $name . 'Name';
    $typeKey = $name . 'Type';
    $nameVal = locationVal($data, $root, $nameKey);
    if ($nameVal === '' || $nameVal === null) return $id;
    $typeVal = locationVal($data, $root, $typeKey);
    return ($typeVal !== '' && $typeVal !== null ? $typeVal . ' ' : '') . $nameVal;
}

function carriesData($field) {
    $skip = ['alert', 'paragraph', 'widgets', 'checkbox', 'file'];
    $type = isset($field['type']) ? $field['type'] : '';
    return !in_array($type, $skip, true);
}

$fields = isset($manifest['fields']) && is_array($manifest['fields']) ? $manifest['fields'] : [];
$locationRaw = isset($manifest['location']) && is_array($manifest['location']) ? $manifest['location'] : [];
$location = [];
if ($locationRaw === array_values($locationRaw)) {
    foreach ($locationRaw as $lc) {
        if (is_array($lc) && isset($lc['name'])) $location[$lc['name']] = $lc;
    }
} else {
    $location = $locationRaw;
}
$settings = isset($manifest['settings']) && is_array($manifest['settings']) ? $manifest['settings'] : [];
$locRoot = isset($manifest['locationWidget']) && is_string($manifest['locationWidget']) && $manifest['locationWidget'] !== '' ? $manifest['locationWidget'] : 'location_widget';

if (count($fields) === 0) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Form configuration not found']);
    exit;
}

$errors = [];
foreach ($fields as $field) {
    $name = isset($field['name']) ? $field['name'] : null;
    if (!$name) continue;
    if (!isFieldVisible($field, $data)) continue;
    if (!isFieldRequired($field, $data)) continue;
    $val = isset($data[$name]) ? $data[$name] : null;
    if (isset($field['widget']) && $field['widget'] === 'map') {
        $val = !empty($data['lat']) ? $data['lat'] : null;
    }
    if (isEmptyValue($val)) {
        $errors[$name] = requiredMessage($field, $data, $settings);
    }
}
foreach ($location as $name => $lcfg) {
    if (!isFieldRequired($lcfg, $data)) continue;
    if (isEmptyValue(locationVal($data, $locRoot, $name))) {
        $errors[$name] = requiredMessage($lcfg, $data, $settings);
    }
}
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

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

$lines = [];
foreach ($fields as $field) {
    $name = isset($field['name']) ? $field['name'] : null;
    if (!$name) continue;
    if (!isFieldVisible($field, $data)) continue;
    if (!carriesData($field)) continue;
    $val = isset($data[$name]) ? $data[$name] : null;
    if (isEmptyValue($val)) continue;
    $label = fieldLabel($field, $data);
    if ($label === '') continue;
    $lines[] = $label . ': ' . sanitize(formatValue($field, $val));
}
foreach ($location as $name => $lcfg) {
    $val = locationVal($data, $locRoot, $name);
    if (isEmptyValue($val)) continue;
    $label = fieldLabel($lcfg, $data);
    if ($label === '') $label = $name;
    $lines[] = $label . ': ' . sanitize(locationDisplay($data, $name, $locRoot));
}
if (!empty($data['lat']) && !empty($data['lng'])) {
    $lines[] = 'Координати: ' . sanitize($data['lat']) . ', ' . sanitize($data['lng']);
}
if (!empty($data['address'])) {
    $lines[] = 'Адреса на карті: ' . sanitize($data['address']);
}

$date = date('Y-m-d H:i:s');

$subjectParts = [];
foreach ($fields as $field) {
    if (count($subjectParts) >= 2) break;
    $type = isset($field['type']) ? $field['type'] : '';
    if ($type !== 'select' && $type !== 'radio') continue;
    $name = isset($field['name']) ? $field['name'] : null;
    if (!$name) continue;
    if (!isFieldVisible($field, $data)) continue;
    $val = isset($data[$name]) ? $data[$name] : null;
    if (isEmptyValue($val) || is_array($val)) continue;
    $label = fieldLabel($field, $data);
    if ($label === '') continue;
    $subjectParts[] = $label . ': ' . formatValue($field, $val);
}
$subject = count($subjectParts) > 0
    ? 'Нове оголошення: ' . implode(', ', $subjectParts)
    : 'Нове оголошення про нерухомість';

$to = 'info@realestate.if.ua';
$headers = "From: add-property@realestate.if.ua\r\n";
$headers .= "Reply-To: noreply@realestate.if.ua\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$message = "Нове оголошення про нерухомість\n";
$message .= "===============================\n\n";
$message .= "Дата: $date\n";
$message .= implode("\n", $lines) . "\n";
$message .= "$uploadedFiles\n\n";
$message .= "---\n";
$message .= "Надіслано через форму додавання оголошення\n";

if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
}
