<?php

class FileParser
{
    public static function fetchUrl($url)
    {
        $curl_ini = curl_init();
        curl_setopt($curl_ini, CURLOPT_URL, $url);
        curl_setopt($curl_ini, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl_ini, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($curl_ini, CURLOPT_TIMEOUT, 30);
        $content = curl_exec($curl_ini);
        $httpCode = curl_getinfo($curl_ini, CURLINFO_HTTP_CODE);
        if ($httpCode == 200 && $content !== false) {
            return $content;
        }

        throw new Exception("Cannot fetch the URL $url");
    }

}