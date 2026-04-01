<?php

require_once __DIR__ . "/service/UnemploymentDataFetching.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

$method = $_SERVER["REQUEST_METHOD"];
$uri = $_SERVER["REQUEST_URI"];

if($method === "OPTIONS"){
    http_response_code(200);
    return;
}

try
{
    if(!file_exists(__DIR__ . "/config/data-dest.json")){
        http_response_code(404);
        echo json_encode([
            "error" => "File not found"
        ]);
    }

    $jsonData = json_decode(file_get_contents(__DIR__ . "/config/data-dest.json"), true);
    if(json_last_error() !== JSON_ERROR_NONE){
        http_response_code(500);
        echo json_encode([
            "error" => "JSON parsing error"
        ]);
    }

    $unemployedDataService = new UnemploymentDataFetching($jsonData);


    switch($method)
    {
        case "GET":
            if($uri === "/api/basic")
            {
                $data = $unemployedDataService->getUnemployedDataBasic();
                // Encode the returned array of objects into a JSON string and send it as the response.
                echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            }
            elseif($uri === "/api/medium")
            {
                $data = $unemployedDataService->getUnemployedDataMedium();
                // Encode the returned array of objects into a JSON string and send it as the response.
                echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            }
            elseif($uri === "/api/age-range")
            {
                $data = $unemployedDataService->getUnemployedDataAgeRange();
                // Encode the returned array of objects into a JSON string and send it as the response.
                echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            }
            elseif($uri === "/api/education-level")
            {
                $data = $unemployedDataService->getUnemployedDataPerEducation();
                // Encode the returned array of objects into a JSON string and send it as the response.
                echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            }
            else{
                http_response_code(404);
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


}catch (Exception $e)
{
    http_response_code(is_int($e->getCode()) && $e->getCode() >=400 ? $e->getCode() : 500);
    echo json_encode([
        "success" => false,
        "status" => $e->getCode(),
        "msg" => $e->getMessage()
    ]);
}
