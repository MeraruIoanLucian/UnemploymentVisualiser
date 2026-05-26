<?php

/**
 * Class FileParser
 *
 * Provides utility methods to handle network operations, specifically fetching
 * remote resource content via cURL.
 */
class FileParser
{
    /**
     * Fetch the content of a remote URL using cURL.
     *
     * @param mixed $url The URL to fetch. Must be a valid URL string.
     * @return string|bool The downloaded content as a string, or false on failure.
     */
    public static function fetchUrl(mixed $url): bool|string
    {
        if (empty($url) || !is_string($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            error_log("Invalid or empty URL provided to FileParser::fetchUrl: " . var_export($url, true));
            return false;
        }

        if (!function_exists('curl_init')) {
            error_log("cURL extension is not installed or enabled.");
            return false;
        }

        $curl_ini = curl_init();
        if ($curl_ini === false) {
            error_log("Failed to initialize cURL session.");
            return false;
        }

        try {
            curl_setopt_array($curl_ini, array(
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => 30,
            ));

            $content = curl_exec($curl_ini);
            $curlError = curl_error($curl_ini);
            $httpCode = curl_getinfo($curl_ini, CURLINFO_HTTP_CODE);
            unset($curl_ini);

            if ($content === false) {
                error_log("cURL error while fetching '$url': " . $curlError);
                return false;
            }

            if ($httpCode !== 200) {
                error_log("Failed to fetch '$url'. Upstream server responded with HTTP status code: " . $httpCode);
                return false;
            }

            return $content;
        } catch (Throwable $e) {
            error_log("An error occurred in FileParser::fetchUrl while fetching '$url': " . $e->getMessage());
            return false;
        }
    }

}