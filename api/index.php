<?php
$conn = require_once __DIR__ . '/db.php';

header("Content-Type: application/json");

$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];
$path = str_replace(dirname($scriptName), '', $requestUri);
$path = strtok($path, '?');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

$jwt_secret = $_ENV['JWT_SECRET'] ?? 'dev_secret_key_change_me';

function base64UrlEncode($text) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
}
function create_jwt($payload, $secret) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = base64UrlEncode($signature);
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}
function verify_jwt($jwt, $secret) {
    if (!$jwt) return false;
    $tokenParts = explode('.', $jwt);
    if (count($tokenParts) !== 3) return false;
    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $signatureProvided = $tokenParts[2];
    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payload);
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = base64UrlEncode($signature);
    if (!hash_equals($base64UrlSignature, $signatureProvided)) return false;
    return json_decode($payload, true);
}
function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}
function requireAuth($secret) {
    $token = getBearerToken();
    $decoded = verify_jwt($token, $secret);
    if (!$decoded || empty($decoded['id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    return $decoded;
}

function fetch_rows($stmt) {
    if (method_exists($stmt, 'get_result')) {
        $result = $stmt->get_result();
        if ($result && is_object($result)) {
            $rows = [];
            while ($r = $result->fetch_assoc()) $rows[] = $r;
            return $rows;
        }
    }
    // Fallback for non-mysqlnd
    if (method_exists($stmt, 'store_result')) {
        $stmt->store_result();
        $metadata = $stmt->result_metadata();
        if (!$metadata) return [];
        
        $params = [];
        $row = [];
        while ($field = $metadata->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        call_user_func_array([$stmt, 'bind_result'], $params);
        
        $results = [];
        while ($stmt->fetch()) {
            $copy = [];
            foreach ($row as $key => $val) $copy[$key] = $val;
            $results[] = $copy;
        }
        return $results;
    }
    return [];
}

if ($method === 'POST' && preg_match('#^/login$#', $path)) {
    $username = $input['username'] ?? '';
    $raw_pass = $input['password'] ?? '';
    if (!$username || !$raw_pass) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password required']);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $rows = fetch_rows($stmt);
    $row = !empty($rows) ? $rows[0] : null;
    
    if ($row) {
        if (!empty($row['password'])) {
            $matches = false;
            if (strlen($row['password']) === 64 && ctype_xdigit($row['password'])) {
                // Legacy SHA256 migration
                $matches = hash_equals($row['password'], hash('sha256', $raw_pass));
                if ($matches) {
                    $new_hash = password_hash($raw_pass, PASSWORD_BCRYPT);
                    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
                    $updateStmt->bind_param("si", $new_hash, $row['id']);
                    $updateStmt->execute();
                }
            } else {
                $matches = password_verify($raw_pass, $row['password']);
            }
            if (!$matches) {
                http_response_code(401);
                echo json_encode(['error' => 'Incorrect password']);
                exit;
            }
        } elseif (empty($row['password'])) {
            $new_hash = password_hash($raw_pass, PASSWORD_BCRYPT);
            $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $updateStmt->bind_param("si", $new_hash, $row['id']);
            $updateStmt->execute();
        }
        $token = create_jwt(['id' => $row['id'], 'username' => $row['username']], $jwt_secret);
        echo json_encode(['id' => $row['id'], 'username' => $row['username'], 'token' => $token]);
    } else {
        $hashed = password_hash($raw_pass, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        $stmt->bind_param("ss", $username, $hashed);
        if ($stmt->execute()) {
            $new_id = $conn->insert_id;
            $token = create_jwt(['id' => $new_id, 'username' => $username], $jwt_secret);
            echo json_encode(['id' => $new_id, 'username' => $username, 'token' => $token]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Creation failed: ' . $conn->error]);
        }
    }

} elseif ($method === 'GET' && preg_match('#^/events$#', $path)) {
    $auth = requireAuth($jwt_secret);
    $userId = $_GET['userId'] ?? '';
    if (!$userId || $auth['id'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, name, data FROM events WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    
    $rows = fetch_rows($stmt);
    $events = [];
    foreach ($rows as $row) {
        $row['data'] = json_decode($row['data']);
        $events[] = $row;
    }
    echo json_encode($events);

} elseif ($method === 'GET' && preg_match('#^/event/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
    $stmt = $conn->prepare("SELECT id, name, data FROM events WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $rows = fetch_rows($stmt);
    if (empty($rows)) {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found']);
    } else {
        $row = $rows[0];
        $row['data'] = json_decode($row['data']);
        echo json_encode($row);
    }

} elseif ($method === 'POST' && preg_match('#^/events$#', $path)) {
    $auth = requireAuth($jwt_secret);
    $userId = $input['userId'];
    
    if ($auth['id'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $name = $input['name'];
    $data = json_encode($input['data']);

    $stmt = $conn->prepare("INSERT INTO events (user_id, name, data) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $userId, $name, $data);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $conn->error]);
    }

} elseif ($method === 'PUT' && preg_match('#^/events/(\d+)$#', $path, $matches)) {
    $auth = requireAuth($jwt_secret);
    $id = $matches[1];
    $reqUserId = $auth['id'];

    $stmt = $conn->prepare("SELECT user_id FROM events WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $rows = fetch_rows($stmt);
    $res = !empty($rows) ? $rows[0] : null;
    
    if (!$res || $res['user_id'] != $reqUserId) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $name = $input['name'];
    $data = json_encode($input['data']);

    $stmt = $conn->prepare("UPDATE events SET name = ?, data = ? WHERE id = ?");
    $stmt->bind_param("ssi", $name, $data, $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $conn->error]);
    }

} elseif ($method === 'DELETE' && preg_match('#^/events/(\d+)$#', $path, $matches)) {
    $auth = requireAuth($jwt_secret);
    $id = $matches[1];
    $reqUserId = $auth['id'];

    $stmt = $conn->prepare("SELECT user_id FROM events WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $rows = fetch_rows($stmt);
    $res = !empty($rows) ? $rows[0] : null;
    
    if (!$res || $res['user_id'] != $reqUserId) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM events WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $conn->error]);
    }

} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found', 'debug_path' => $path]);
}

$conn->close();