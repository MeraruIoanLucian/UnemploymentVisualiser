<?php

class FileParser
{
    public static function fetchUrl($url)
    {
        if (!function_exists('curl_init')) {
            throw new Exception("cURL extension is not installed or enabled, which is required to fetch data.", 500);
        }

        $curl_ini = curl_init();
        curl_setopt($curl_ini, CURLOPT_URL, $url);
        curl_setopt($curl_ini, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl_ini, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($curl_ini, CURLOPT_TIMEOUT, 30);
        $content = curl_exec($curl_ini);
        $curlError = curl_error($curl_ini);
        $httpCode = curl_getinfo($curl_ini, CURLINFO_HTTP_CODE);
        curl_close($curl_ini);

        if ($content === false) {
            throw new Exception("cURL error while fetching '$url': " . $curlError, 500);
        }

        if ($httpCode !== 200) {
            // Using 502 Bad Gateway as it indicates an invalid response from an upstream server.
            throw new Exception("Failed to fetch '$url'. Upstream server responded with HTTP status code: " . $httpCode, 502);
        }

        return $content;
    }

}