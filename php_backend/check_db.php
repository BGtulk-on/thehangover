<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Detailed Environment Test</h1>";

$envPath = dirname(__DIR__) . '/.env';

echo "<p>Checking path: <code>$envPath</code></p>";

if (!file_exists($envPath)) {
    die("<h2 style='color:red'>ERROR: .env file does not exist!</h2>");
}

echo "<p style='color:green'>File exists.</p>";

$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

if ($lines === false) {
    die("<h2 style='color:red'>ERROR: Could not read file content (Permission denied?)</h2>");
}

echo "<h3>Parsing .env lines:</h3><ul>";

$env_vars = [];

foreach ($lines as $index => $line) {
    $line = trim($line);
    if ($line === '' || strpos($line, '#') === 0) continue;

    $parts = explode('=', $line, 2);
    if (count($parts) == 2) {
        $key = trim($parts[0]);
        $val = trim($parts[1]);
        $env_vars[$key] = $val;
        echo "<li>Loaded <strong>$key</strong> = " . substr($val, 0, 3) . "***</li>";
    } else {
        echo "<li style='color:orange'>Skipped malformed line: " . htmlspecialchars($line) . "</li>";
    }
}
echo "</ul>";

$host = $env_vars['DB_HOST'] ?? 'NOT_SET';
$user = $env_vars['DB_USER'] ?? 'NOT_SET';
$pass = $env_vars['DB_PASSWORD'] ?? '';
$name = $env_vars['DB_NAME'] ?? 'NOT_SET';

echo "<hr>";
echo "<h3>Testing Connection with Loaded Variables:</h3>";
echo "Host: $host<br>User: $user<br>Database: $name<br>";

if ($host === 'NOT_SET' || $user === 'NOT_SET') {
    die("<h2 style='color:red'>FAIL: Variables not loaded from .env</h2>");
}

$conn = new mysqli($host, $user, $pass, $name);

if ($conn->connect_error) {
    echo "<h2 style='color:red'>Connection Error: " . $conn->connect_error . "</h2>";
} else {
    echo "<h2 style='color:green'>SUCCESS! Database connected.</h2>";
}
?>
