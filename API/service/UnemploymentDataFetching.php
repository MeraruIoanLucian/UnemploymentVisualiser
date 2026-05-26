<?php

require_once __DIR__ . "/../models/UnemploymentDataBasic.php";
require_once __DIR__ . "/../models/UnemploymentDataPerMedium.php";
require_once __DIR__ . "/../models/UnemploymentDataPerAgeRange.php";
require_once __DIR__ . "/../models/UnemploymentDataPerEducationLevel.php";
require_once __DIR__ . "/FileParser.php";
require_once __DIR__ . "/CacheSystem.php";

use models\UnemploymentDataBasic;
use models\UnemploymentDataPerMedium;
use models\UnemploymentDataPerAgeRange;
use models\UnemploymentDataPerEducationLevel;

class UnemploymentDataFetching
{
    private array $config;
    private CacheSystem $cacheSystem;
    private const string DATA_GOV_BASE_URL = 'https://data.gov.ro/dataset/';

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->cacheSystem = new CacheSystem();
    }
    # Private method to get the package ID and resource ID
    private function getResourceInfo(string $packageName, string $fileName): ?array
    {
        if (!isset($this->config[$packageName])) {
            return null;
        }

        $packageConfig = $this->config[$packageName];
        if (!isset($packageConfig['contents'][$fileName])) {
            return null;
        }

        return [
            'package_id' => $packageConfig['package_id'],
            'resource_id' => $packageConfig['contents'][$fileName]
        ];
    }

    /**
     * Fetches and parses unemployment data from a remote CSV file based on the file name.
     *
     * @param string $packageName
     * @param string $fileName
     * @return array
     * @throws Exception
     */
    public function getUnemploymentData(string $packageName, string $fileName): array
    {
        # Retrieves the Package and Resource id
        $resourceInfo = $this->getResourceInfo($packageName, $fileName);

        if ($resourceInfo === null) {
            throw new Exception("Resource '$fileName' for package '$packageName' not found in configuration.", 404);
        }

        # First we check if the cached file exists
        $cacheFileName = "{$packageName}_{$fileName}";
        $csvContent = $this->cacheSystem->get($cacheFileName);

        # If the cached file doesn't exist, we fetch data from data.gov.ro and store it to the cache directory
        if ($csvContent === null) {
            $packageId = $resourceInfo['package_id'];
            $resourceId = $resourceInfo['resource_id'];

            $url = self::DATA_GOV_BASE_URL . "{$packageId}/resource/{$resourceId}/download/{$fileName}";

            $csvContent = FileParser::fetchUrl($url);

            if ($csvContent === false) {
                throw new Exception("Failed to fetch data from remote source for package '$packageName', file '$fileName'.", 502);
            }

            $this->cacheSystem->put($cacheFileName, $csvContent);
        }

        if (empty($csvContent)) {
            throw new Exception("Fetched content for '$fileName' is empty.", 500);
        }

        # We open a temporary stream to store CSV contents

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $csvContent);
        rewind($stream);

        // Skip the header line
        $headerLine = fgets($stream);
        $delimiter = ',';
        if ($headerLine !== false && str_contains($headerLine, ';')) {
            $delimiter = ';';
        }

        $unemploymentData = [];
        $totalKeywords = ['Total', 'Total TARA', 'TOTAL', 'Total general'];

        # Parsing the CSV File
        while (($row = fgetcsv($stream, 0, $delimiter, '"', '')) !== false) {
            # Skip empty rows
            if (empty($row) || $row[0] === null) {
                continue;
            }

            // Skip header/total rows or rows without a county name
            if (count($row) < 2 || empty(trim($row[0])) || in_array(trim($row[0]), $totalKeywords, true)) {
                continue;
            }

            try {
                $countyName = trim($row[0]);
                // Data sanitization: Correct known data entry errors from the source CSV.
                // The source file literally contains "CARA?-SEVERIN" instead of "CARAS-SEVERIN".
                if ($countyName === 'CARA?-SEVERIN') {
                    $countyName = 'CARAS-SEVERIN';
                }

                # Serializing data based off the file name
                switch ($fileName) {
                    case 'rata.csv':
                        if (count($row) < 9) {
                            continue 2;
                        }
                        $unemploymentData[] = new UnemploymentDataBasic(
                            county: $countyName,
                            nrUnemployed: (int) str_replace('.', '', trim($row[1])),
                            nrFemaleUnemployed: (int) str_replace('.', '', trim($row[2])),
                            nrMaleUnemployed: (int) str_replace('.', '', trim($row[3])),
                            nrCompensatedUnemployed: (int) str_replace('.', '', trim($row[4])),
                            nrNonCompensatedUnemployed: (int) str_replace('.', '', trim($row[5])),
                            unemploymentRate: (float) str_replace(',', '.', trim($row[6])),
                            femaleUnemploymentRate: (float) str_replace(',', '.', trim($row[7])),
                            maleUnemploymentRate: (float) str_replace(',', '.', trim($row[8]))
                        );
                        break;
                    case 'medii.csv':
                        if (count($row) < 10) {
                            continue 2;
                        }
                        $unemploymentData[] = new UnemploymentDataPerMedium(
                            county: $countyName,
                            totalUnemployed: (int) str_replace('.', '', trim($row[1])),
                            totalFemaleUnemployed: (int) str_replace('.', '', trim($row[2])),
                            totalMaleUnemployed: (int) str_replace('.', '', trim($row[3])),
                            totalUnemployedUrban: (int) str_replace('.', '', trim($row[4])),
                            totalFemaleUnemployedUrban: (int) str_replace('.', '', trim($row[5])),
                            totalMaleUnemployedUrban: (int) str_replace('.', '', trim($row[6])),
                            totalUnemployedRural: (int) str_replace('.', '', trim($row[7])),
                            totalFemaleUnemployedRural: (int) str_replace('.', '', trim($row[8])),
                            totalMaleUnemployedRural: (int) str_replace('.', '', trim($row[9]))
                        );
                        break;
                    case 'varste.csv':
                        if (count($row) < 7) {
                            continue 2;
                        }
                        $unemploymentData[] = new UnemploymentDataPerAgeRange(
                            county: $countyName,
                            under25: (int) str_replace('.', '', trim($row[1])),
                            from25to29: (int) str_replace('.', '', trim($row[2])),
                            from30to39: (int) str_replace('.', '', trim($row[3])),
                            from40to49: (int) str_replace('.', '', trim($row[4])),
                            from50to59: (int) str_replace('.', '', trim($row[5])),
                            over50: (int) str_replace('.', '', trim($row[6]))
                        );
                        break;
                    case 'nivel-educatie.csv':
                        if (count($row) < 8) {
                            continue 2;
                        }
                        $unemploymentData[] = new UnemploymentDataPerEducationLevel(
                            county: $countyName,
                            noStudy: (int) str_replace('.', '', trim($row[1])),
                            primaryStudy: (int) str_replace('.', '', trim($row[2])),
                            middleStudy: (int) str_replace('.', '', trim($row[3])),
                            highStudy: (int) str_replace('.', '', trim($row[4])),
                            postHighStudy: (int) str_replace('.', '', trim($row[5])),
                            professionalStudy: (int) str_replace('.', '', trim($row[6])),
                            universityStudy: (int) str_replace('.', '', trim($row[7]))
                        );
                        break;
                }
            } catch (TypeError $e) {
                error_log("Skipping row due to data error: " . implode(';', $row) . " | Error: " . $e->getMessage());
            }
        }

        fclose($stream);
        return $unemploymentData;
    }
}
