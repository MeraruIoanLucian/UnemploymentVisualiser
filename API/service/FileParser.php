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

    public static function parseCsv($csvContents){
        $rows = [];
        $lines = explode("\n", $csvContents);
        if(empty($lines)){
            return $rows;
        }

        $headers = str_getcsv(array_shift($lines));
        foreach ($lines as $line) {
            if (trim($line) === '') continue;
            $data = str_getcsv($line);
            // Ensure data array matches headers length
            if (count($data) < count($headers)) {
                $data = array_pad($data, count($headers), '');
            }
            $rows[] = array_combine($headers, array_slice($data, 0, count($headers)));
        }
        return $rows;
    }
}