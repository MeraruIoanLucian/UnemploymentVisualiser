<?php

require_once __DIR__ . "/service/UnemploymentDataFetching.php";
require_once __DIR__ . "/service/CacheSystem.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

$method = $_SERVER["REQUEST_METHOD"];
$uri = $_SERVER["REQUEST_URI"];

# URI Schema (FETCH_DATA): /api/{PACKAGE_NAME}/{FILE_NAME}
# URI Schema (CACHE): /api/cache/{FILE_NAME}

$uri_bits = explode("/", $uri);

if(str_starts_with($uri, "/api/cache/"))
{
    $filename = $uri_bits[3] ?? null;
} else {
    $package_name = $uri_bits[2] ?? null;
    $filename = $uri_bits[3] ?? null;
}

if ($method === "OPTIONS") {
    http_response_code(200);
    return;
}

const CACHE_DIR = __DIR__ . '/cache';
const CACHE_LIFETIME = 7 * 24 * 60 * 60; // 7 days in seconds

// Auto-delete old cache files
if (is_dir(CACHE_DIR)) {
    foreach (scandir(CACHE_DIR) as $file) {
        if ($file !== '.' && $file !== '..') {
            $filePath = CACHE_DIR . '/' . $file;
            if (filemtime($filePath) < (time() - CACHE_LIFETIME)) {
                unlink($filePath);
            }
        }
    }
}


try {
    if (!file_exists(__DIR__ . "/config/data-dest.json")) {
        http_response_code(404);
        echo json_encode([
            "error" => "File not found"
        ]);
        return;
    }

    $jsonData = json_decode(file_get_contents(__DIR__ . "/config/data-dest.json"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode([
            "error" => "JSON parsing error"
        ]);
        return;
    }

    $unemployedDataService = new UnemploymentDataFetching($jsonData);
    $cacheSystem = new CacheSystem();

    switch ($method) {
        case "GET":
            if ($package_name && $filename) {
                $allowedFiles = ['rata.csv', 'medii.csv', 'varste.csv', 'nivel-educatie.csv'];
                if (in_array($filename, $allowedFiles)) {
                    $data = $unemployedDataService->getUnemploymentData($package_name, $filename);
                    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "File not found"]);
                }
            } elseif ($uri === '/api/cache')
            {
                $entries = $cacheSystem->getAll();
                http_response_code(200);
                echo json_encode($entries, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            } elseif ($uri === '/api/cache/' . $filename)
            {
                $entry = $cacheSystem->getByName($filename);
                if ($entry) {
                    http_response_code(200);
                    echo json_encode($entry, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                } else{
                    http_response_code(404);
                    echo json_encode(["error" => "File not found"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Missing package name or filename"]);
            }
            break;
        case "DELETE":
            if ($uri === '/api/cache') {
                $cacheSystem->clear();
                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "msg" => "Cache folder deleted"
                ]);
            } elseif ($uri === '/api/cache/' . $filename){
                if ($cacheSystem->delete($filename)) {
                    http_response_code(200);
                    echo json_encode([
                        "success" => true,
                        "msg" => "File deleted"
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "File not found"]);
                }
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Not Found"]);
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

} catch (Exception $e) {
    http_response_code(is_int($e->getCode()) && $e->getCode() >= 400 ? $e->getCode() : 500);
    echo json_encode([
        "success" => false,
        "status" => $e->getCode(),
        "msg" => $e->getMessage()
    ]);
}
