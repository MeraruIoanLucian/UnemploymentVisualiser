<?php

// Importing necessary files
require_once __DIR__ . "/service/UnemploymentDataFetching.php";
require_once __DIR__ . "/service/CacheSystem.php";

# Establishing headers
header("Access-Control-Allow-Origin: *"); # Allowed origin point IE: localhost:3000
header("Access-Control-Allow-Methods: GET, OPTIONS"); # Allowed methods
header("Access-Control-Allow-Headers: *"); # Allowed headers
header("Content-Type: application/json"); # Returns content as json

$method = $_SERVER["REQUEST_METHOD"]; # Retrieve methods from request
$uri = $_SERVER["REQUEST_URI"]; # Retrieve URI from request

# URI Schema (FETCH_DATA): /api/{PACKAGE_NAME}/{FILE_NAME}

# Exploding the URI
$uri_bits = explode("/", $uri);
$package_name = $uri_bits[2] ?? null;
$filename = $uri_bits[3] ?? null;

# Fallback for OPTIONS method
if ($method === "OPTIONS") {
    http_response_code(200);
    return;
}

// Initialize Cache System and clean expired cache files
$cacheSystem = new CacheSystem();
$cacheSystem->cleanExpired();


try {
    # Checking if the persistent storage is present
    if (!file_exists(__DIR__ . "/config/data-dest.json")) {
        http_response_code(404);
        echo json_encode([
            "error" => "File not found"
        ]);
        return;
    }
     # parsing the persistent storage
    $jsonData = json_decode(file_get_contents(__DIR__ . "/config/data-dest.json"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode([
            "error" => "JSON parsing error"
        ]);
        return;
    }

    # Initializing the Fetching Data Service
    $unemployedDataService = new UnemploymentDataFetching($jsonData);

    switch ($method) {
        # Fetching Endpoint
        case "GET":
            if ($package_name && $filename) {
                $allowedFiles = ['rata.csv', 'medii.csv', 'varste.csv', 'nivel-educatie.csv'];
                if (in_array($filename, $allowedFiles)) {
                    $data = $unemployedDataService->getUnemploymentData($package_name, $filename);
                    echo json_encode($data);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "File not found"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Missing package name or filename"]);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode([
                "success" => false,
                "status" => 405,
                "msg" => "Method not allowed"
            ]);
            break;
    }

} catch (Throwable $e) {
    http_response_code(is_int($e->getCode()) && $e->getCode() >= 400 ? $e->getCode() : 500);
    echo json_encode([
        "success" => false,
        "status" => $e->getCode(),
        "msg" => $e->getMessage()
    ]);
}


