<?php

require_once __DIR__ . "/../models/UnemploymentDataBasic.php";
require_once __DIR__ . "/../models/UnemploymentDataPerMedium.php";
require_once __DIR__ . "/../models/UnemploymentDataPerAgeRange.php";
require_once __DIR__ . "/../models/UnemploymentDataPerEducationLevel.php";
require_once __DIR__ . "/FileParser.php";

use models\UnemploymentDataBasic;
use models\UnemploymentDataPerMedium;
use models\UnemploymentDataPerAgeRange;
use models\UnemploymentDataPerEducationLevel;
class UnemploymentDataFetching
{
    private array $config;
    private const DATA_GOV_BASE_URL = 'https://data.gov.ro/dataset/';

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    /**
     * Finds the resource details for a given filename from the configuration.
     *
     * @param string $fileName
     * @return array|null
     */
    private function getResourceInfo(string $fileName): ?array
    {
        foreach ($this->config['contents'] as $content) {
            if ($content['file_name'] === $fileName) {
                return $content;
            }
        }
        return null;
    }

    /**
     * Fetches and parses the unemployment data from the remote CSV file.
     *
     * @return UnemploymentDataBasic[]
     * @throws Exception
     */
    public function getUnemployedDataBasic(): array
    {
        $fileName = 'rata.csv';
        $resourceInfo = $this->getResourceInfo($fileName);

        if ($resourceInfo === null) {
            throw new Exception("Resource '$fileName' not found in configuration.", 404);
        }

        $packageId = $this->config['package_id'];
        $resourceId = $resourceInfo['resource_id'];

        $url = self::DATA_GOV_BASE_URL . "{$packageId}/resource/{$resourceId}/download/{$fileName}";

        // Use the static fetchUrl method from FileParser to get the CSV content as a string
        $csvContent = FileParser::fetchUrl($url);

        if (empty($csvContent)) {
            throw new Exception("Fetched content for '$fileName' is empty.", 500);
        }

        // Split content into lines and skip the header
        $lines = str_getcsv($csvContent, "\n");
        array_shift($lines);

        $unemploymentData = [];

        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line, ';'); // The data is semicolon-delimited

            // Skip empty rows, malformed rows (less than 7 columns), or the "Total" summary row
            if (count($row) < 7 || empty(trim($row[0])) || trim($row[0]) === 'Total') {
                continue;
            }

            try {
                $unemploymentData[] = new UnemploymentDataBasic(
                    county: trim($row[0]),
                    nrUnemployed: (int) str_replace('.', '', trim($row[1])),
                    nrFemaleUnemployed: (int) str_replace('.', '', trim($row[2])),
                    nrMaleUnemployed: (int) str_replace('.', '', trim($row[3])),
                    nrCompensatedUnemployed: (int) str_replace('.', '', trim($row[4])),
                    nrNonCompensatedUnemployed: (int) str_replace('.', '', trim($row[5])),
                    unemploymentRate: (float) str_replace(',', '.', trim($row[6])),
                    // The source data might be missing the last two columns, so we default them to 0.0
                    femaleUnemploymentRate:(float) str_replace(',', '.', trim($row[7])),
                    maleUnemploymentRate:(float) str_replace(',', '.', trim($row[8]))
                );
            } catch (TypeError $e) {
                // Log if a row has data that can't be cast correctly, then continue
                error_log("Skipping row due to data error: " . implode(';', $row) . " | Error: " . $e->getMessage());
            }
        }

        return $unemploymentData;
    }
    public function getUnemployedDataMedium(): array
    {
        $fileName = 'medii.csv';
        $resourceInfo = $this->getResourceInfo($fileName);

        if ($resourceInfo === null) {
            throw new Exception("Resource '$fileName' not found in configuration.", 404);
        }

        $packageId = $this->config['package_id'];
        $resourceId = $resourceInfo['resource_id'];

        $url = self::DATA_GOV_BASE_URL . "{$packageId}/resource/{$resourceId}/download/{$fileName}";

        // Use the static fetchUrl method from FileParser to get the CSV content as a string
        $csvContent = FileParser::fetchUrl($url);

        if (empty($csvContent)) {
            throw new Exception("Fetched content for '$fileName' is empty.", 500);
        }

        // Split content into lines and skip the header
        $lines = str_getcsv($csvContent, "\n");
        array_shift($lines);

        $unemploymentData = [];

        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line, ';'); // The data is semicolon-delimited

            // Skip empty rows, malformed rows (less than 7 columns), or the "Total" summary row
            if (count($row) < 7 || empty(trim($row[0])) || trim($row[0]) === 'Total' || trim($row[0]) === 'Total TARA') {
                continue;
            }

            try {
                $unemploymentData[] = new UnemploymentDataPerMedium(
                    county: trim($row[0]),
                    totalUnemployed: (int) str_replace('.', '', trim($row[1])),
                    totalFemaleUnemployed: (int) str_replace('.', '', trim($row[2])),
                    totalMaleUnemployed: (int) str_replace('.', '', trim($row[3])),
                    totalUnemployedUrban: (int) str_replace('.', '', trim($row[4])),
                    totalFemaleUnemployedUrban: (int) str_replace('.', '', trim($row[5])),
                    totalMaleUnemployedUrban: (int) str_replace(',', '.', trim($row[6])),
                    totalUnemployedRural:(int) str_replace(',', '.', trim($row[7])),
                    totalFemaleUnemployedRural:(int) str_replace(',', '.', trim($row[8])),
                    totalMaleUnemployedRural:(int) str_replace(',', '.', trim($row[8]))
                );
            } catch (TypeError $e) {
                // Log if a row has data that can't be cast correctly, then continue
                error_log("Skipping row due to data error: " . implode(';', $row) . " | Error: " . $e->getMessage());
            }
        }

        return $unemploymentData;
    }
    public function getUnemployedDataAgeRange(): array
    {
        $fileName = 'varste.csv';
        $resourceInfo = $this->getResourceInfo($fileName);

        if ($resourceInfo === null) {
            throw new Exception("Resource '$fileName' not found in configuration.", 404);
        }

        $packageId = $this->config['package_id'];
        $resourceId = $resourceInfo['resource_id'];

        $url = self::DATA_GOV_BASE_URL . "{$packageId}/resource/{$resourceId}/download/{$fileName}";

        // Use the static fetchUrl method from FileParser to get the CSV content as a string
        $csvContent = FileParser::fetchUrl($url);

        if (empty($csvContent)) {
            throw new Exception("Fetched content for '$fileName' is empty.", 500);
        }

        // Split content into lines and skip the header
        $lines = str_getcsv($csvContent, "\n");
        array_shift($lines);

        $unemploymentData = [];

        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line, ';'); // The data is semicolon-delimited

            // Skip empty rows, malformed rows (less than 7 columns), or the "Total" summary row
            if (count($row) < 7 || empty(trim($row[0])) || trim($row[0]) === 'Total' || trim($row[0]) === 'Total TARA') {
                continue;
            }

            try {
                $unemploymentData[] = new UnemploymentDataPerAgeRange(
                    county: trim($row[0]),
                    under25: (int) str_replace('.', '', trim($row[1])),
                    from25to29: (int) str_replace('.', '', trim($row[2])),
                    from30to39: (int) str_replace('.', '', trim($row[3])),
                    from40to49: (int) str_replace('.', '', trim($row[4])),
                    from50to59: (int) str_replace('.', '', trim($row[5])),
                    over50: (float) str_replace(',', '.', trim($row[6])),
                );
            } catch (TypeError $e) {
                // Log if a row has data that can't be cast correctly, then continue
                error_log("Skipping row due to data error: " . implode(';', $row) . " | Error: " . $e->getMessage());
            }
        }

        return $unemploymentData;
    }
    public function getUnemployedDataPerEducation(): array
    {
        $fileName = 'nivel-educatie.csv';
        $resourceInfo = $this->getResourceInfo($fileName);

        if ($resourceInfo === null) {
            throw new Exception("Resource '$fileName' not found in configuration.", 404);
        }

        $packageId = $this->config['package_id'];
        $resourceId = $resourceInfo['resource_id'];

        $url = self::DATA_GOV_BASE_URL . "{$packageId}/resource/{$resourceId}/download/{$fileName}";

        // Use the static fetchUrl method from FileParser to get the CSV content as a string
        $csvContent = FileParser::fetchUrl($url);

        if (empty($csvContent)) {
            throw new Exception("Fetched content for '$fileName' is empty.", 500);
        }

        // Split content into lines and skip the header
        $lines = str_getcsv($csvContent, "\n");
        array_shift($lines);

        $unemploymentData = [];

        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line, ';'); // The data is semicolon-delimited

            // Skip empty rows, malformed rows (less than 7 columns), or the "Total" summary row
            if (count($row) < 7 || empty(trim($row[0])) || trim($row[0]) === 'Total' || trim($row[0]) === 'Total TARA') {
                continue;
            }

            try {
                $unemploymentData[] = new UnemploymentDataPerEducationLevel(
                    county: trim($row[0]),
                    noStudy: (int) str_replace('.', '', trim($row[1])),
                    primaryStudy: (int) str_replace('.', '', trim($row[2])),
                    middleStudy: (int) str_replace('.', '', trim($row[3])),
                    highStudy: (int) str_replace('.', '', trim($row[4])),
                    postHighStudy: (int) str_replace('.', '', trim($row[5])),
                    professionalStudy: (int) str_replace(',', '.', trim($row[6])),
                    // The source data might be missing the last two columns, so we default them to 0.0
                    universityStudy:(int) str_replace(',', '.', trim($row[7])),
                );
            } catch (TypeError $e) {
                // Log if a row has data that can't be cast correctly, then continue
                error_log("Skipping row due to data error: " . implode(';', $row) . " | Error: " . $e->getMessage());
            }
        }

        return $unemploymentData;
    }
}