<?php
$conn = require_once 'db.php';

header("Content-Type: application/json");

// Get the request URI/path relative to the API root
// This removes '/api' if it exists in the path, or just gets the path after script name
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];
$path = str_replace(dirname($scriptName), '', $requestUri);
$path = strtok($path, '?'); // Remove query string

// Simple Router
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST' && preg_match('#^/login$#', $path)) {
    $username = $input['username'] ?? '';
    if (!$username) {
        http_response_code(400);
        echo json_encode(['error' => 'Username required']);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, username FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode($result->fetch_assoc());
    } else {
        $stmt = $conn->prepare("INSERT INTO users (username) VALUES (?)");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        echo json_encode(['id' => $conn->insert_id, 'username' => $username]);
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
    $result = $stmt->get_result();
    
    $events = [];
    while ($row = $result->fetch_assoc()) {
        $row['data'] = json_decode($row['data']);
        $events[] = $row;
    }
    echo json_encode($events);

} elseif ($method === 'GET' && preg_match('#^/event/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
    $stmt = $conn->prepare("SELECT id, name, data FROM events WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found']);
    } else {
        $row = $result->fetch_assoc();
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
