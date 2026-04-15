<?php
/**
 * Proxy PHP pentru a comunica cu API-ul backend.
 * Frontend-ul face request-uri catre acest fisier,
 * care le forwardeaza catre containerul API via Docker network.
 *
 * Parametri GET:
 *   - action: 'data' (default) sau 'packages'
 *   - package: numele pachetului (ex: 'mai2025')
 *   - file: numele fisierului CSV (ex: 'rata.csv')
 */

header("Content-Type: application/json; charset=utf-8");

$action = $_GET['action'] ?? 'data';

// Configurare host API - in Docker, serviciul se numeste 'api'
$apiHost = getenv('API_HOST') ?: 'localhost';
$apiPort = getenv('API_PORT') ?: '8080';

// Returneaza lista de pachete (luni) disponibile
if ($action === 'packages') {
    echo json_encode([
        'mai2025' => 'Mai 2025',
        'aprilie2025' => 'Aprilie 2025',
        'martie2025' => 'Martie 2025',
        'februarie2025' => 'Februarie 2025',
        'ianuarie2025' => 'Ianuarie 2025',
        'decembrie2024' => 'Decembrie 2024',
        'iulie2024' => 'Iulie 2024',
        'iunie2024' => 'Iunie 2024',
        'mai2024' => 'Mai 2024',
        'aprilie2024' => 'Aprilie 2024',
        'martie2024' => 'Martie 2024',
        'februarie2024' => 'Februarie 2024',
        'noiembrie2023' => 'Noiembrie 2023',
        'octombrie2023' => 'Octombrie 2023',
        'august2023' => 'August 2023',
        'iulie2023' => 'Iulie 2023',
        'iunie2023' => 'Iunie 2023',
        'februarie2023' => 'Februarie 2023'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Validare parametri
$package = $_GET['package'] ?? null;
$file = $_GET['file'] ?? null;

if (!$package || !$file) {
    http_response_code(400);
    echo json_encode(["error" => "Parametrii 'package' si 'file' sunt obligatorii."]);
    exit;
}

// Validare fisier permis
$allowedFiles = ['rata.csv', 'medii.csv', 'varste.csv', 'nivel-educatie.csv'];
if (!in_array($file, $allowedFiles)) {
    http_response_code(400);
    echo json_encode(["error" => "Fisier invalid: $file"]);
    exit;
}

// Construim URL-ul catre API
$url = "http://{$apiHost}:{$apiPort}/api/{$package}/{$file}";

// Facem request-ul cu file_get_contents
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 30,
        'ignore_errors' => true
    ]
]);

$response = @file_get_contents($url, false, $context);

// Verificam raspunsul
if ($response === false) {
    http_response_code(502);
    echo json_encode(["error" => "Nu s-a putut contacta API-ul la $url"]);
    exit;
}

// Extragem codul HTTP din headerele de raspuns
$httpCode = 200;
if (isset($http_response_header)) {
    foreach ($http_response_header as $header) {
        if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
            $httpCode = (int) $matches[1];
        }
    }
}

http_response_code($httpCode);
echo $response;
