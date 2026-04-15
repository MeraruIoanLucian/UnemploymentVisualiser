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
    private const DATA_GOV_BASE_URL = 'https://data.gov.ro/dataset/';

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->cacheSystem = new CacheSystem();
    }

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
        $resourceInfo = $this->getResourceInfo($packageName, $fileName);

        if ($resourceInfo === null) {
            throw new Exception("Resource '$fileName' for package '$packageName' not found in configuration.", 404);
        }

        $cacheFileName = "{$packageName}_{$fileName}";
        $csvContent = $this->cacheSystem->get($cacheFileName);

        if ($csvContent === null) {
            $packageId = $resourceInfo['package_id'];
            $resourceId = $resourceInfo['resource_id'];

            $url = self::DATA_GOV_BASE_URL . "{$packageId}/resource/{$resourceId}/download/{$fileName}";

            $csvContent = FileParser::fetchUrl($url);
            $this->cacheSystem->put($cacheFileName, $csvContent);
        }

        if (empty($csvContent)) {
            throw new Exception("Fetched content for '$fileName' is empty.", 500);
        }

        $lines = str_getcsv($csvContent, "\n", '"', '');
        array_shift($lines);

        $unemploymentData = [];

        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line, ';', '"', '');

            if (count($row) < 7 || empty(trim($row[0])) || trim($row[0]) === 'Total' || trim($row[0]) === 'Total TARA') {
                continue;
            }

            try {
                switch ($fileName) {
                    case 'rata.csv':
                        $unemploymentData[] = new UnemploymentDataBasic(
                            county: trim($row[0]),
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
                        $unemploymentData[] = new UnemploymentDataPerMedium(
                            county: trim($row[0]),
                            totalUnemployed: (int) str_replace('.', '', trim($row[1])),
                            totalFemaleUnemployed: (int) str_replace('.', '', trim($row[2])),
                            totalMaleUnemployed: (int) str_replace('.', '', trim($row[3])),
                            totalUnemployedUrban: (int) str_replace('.', '', trim($row[4])),
                            totalFemaleUnemployedUrban: (int) str_replace('.', '', trim($row[5])),
                            totalMaleUnemployedUrban: (int) str_replace(',', '.', trim($row[6])),
                            totalUnemployedRural: (int) str_replace(',', '.', trim($row[7])),
                            totalFemaleUnemployedRural: (int) str_replace(',', '.', trim($row[8])),
                            totalMaleUnemployedRural: (int) str_replace(',', '.', trim($row[8]))
                        );
                        break;
                    case 'varste.csv':
                        $unemploymentData[] = new UnemploymentDataPerAgeRange(
                            county: trim($row[0]),
                            under25: (int) str_replace('.', '', trim($row[1])),
                            from25to29: (int) str_replace('.', '', trim($row[2])),
                            from30to39: (int) str_replace('.', '', trim($row[3])),
                            from40to49: (int) str_replace('.', '', trim($row[4])),
                            from50to59: (int) str_replace('.', '', trim($row[5])),
                            over50: (float) str_replace(',', '.', trim($row[6]))
                        );
                        break;
                    case 'nivel-educatie.csv':
                        $unemploymentData[] = new UnemploymentDataPerEducationLevel(
                            county: trim($row[0]),
                            noStudy: (int) str_replace('.', '', trim($row[1])),
                            primaryStudy: (int) str_replace('.', '', trim($row[2])),
                            middleStudy: (int) str_replace('.', '', trim($row[3])),
                            highStudy: (int) str_replace('.', '', trim($row[4])),
                            postHighStudy: (int) str_replace('.', '', trim($row[5])),
                            professionalStudy: (int) str_replace(',', '.', trim($row[6])),
                            universityStudy: (int) str_replace(',', '.', trim($row[7]))
                        );
                        break;
                }
            } catch (TypeError $e) {
                error_log("Skipping row due to data error: " . implode(';', $row) . " | Error: " . $e->getMessage());
            }
        }

        return $unemploymentData;
    }
}
