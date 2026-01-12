<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Database Connection Test</h1>";

$envPath = dirname(__DIR__) . '/.env';
echo "<p>Looking for .env at: " . $envPath . "</p>";

if (file_exists($envPath)) {
    echo "<p style='color:green'>.env file FOUND.</p>";
    $lines = file($envPath);
    echo "<p>Read " . count($lines) . " lines from .env.</p>";
} else {
    echo "<p style='color:red'>.env file NOT FOUND.</p>";
}

$host = 'localhost';
$user = 'root';
$pass = ''; 
$dbname = 'thehangover';

echo "<hr>";
echo "<h3>Testing MySQL Connection...</h3>";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    echo "<p style='color:red'>Connection Failed: " . $conn->connect_error . "</p>";
} else {
    echo "<p style='color:green'>Connection SUCCESS!</p>";
    $conn->close();
}
?>
