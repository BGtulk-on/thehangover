<?php
$conn = require_once 'db.php';

header("Content-Type: application/json");

$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];
$path = str_replace(dirname($scriptName), '', $requestUri);
$path = strtok($path, '?');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

function fetch_rows($stmt) {
    if (method_exists($stmt, 'get_result')) {
        $result = $stmt->get_result();
        if ($result) {
            $rows = [];
            while ($r = $result->fetch_assoc()) $rows[] = $r;
            return $rows;
        }
    }
    
    // Fallback for non-mysqlnd
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

if ($method === 'POST' && preg_match('#^/login$#', $path)) {
    $username = $input['username'] ?? '';
    $raw_pass = $input['password'] ?? '';
    if (!$username || !$raw_pass) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password required']);
        exit;
    }

    $hashed_pass = hash('sha256', $raw_pass);

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
        if (!empty($row['password']) && $row['password'] !== $hashed_pass) {
            http_response_code(401);
            echo json_encode(['error' => 'Incorrect password']);
            exit;
        } elseif (empty($row['password'])) {
            $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $updateStmt->bind_param("si", $hashed_pass, $row['id']);
            $updateStmt->execute();
        }
        echo json_encode(['id' => $row['id'], 'username' => $row['username']]);
    } else {
        $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        $stmt->bind_param("ss", $username, $hashed_pass);
        if ($stmt->execute()) {
            echo json_encode(['id' => $conn->insert_id, 'username' => $username]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Creation failed: ' . $conn->error]);
        }
    }

} elseif ($method === 'GET' && preg_match('#^/events$#', $path)) {
    $userId = $_GET['userId'] ?? '';
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
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
    $userId = $input['userId'];
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
    $id = $matches[1];
    $reqUserId = $_SERVER['HTTP_USER_ID'] ?? '';

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
    $id = $matches[1];
    $reqUserId = $_SERVER['HTTP_USER_ID'] ?? '';

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
?>