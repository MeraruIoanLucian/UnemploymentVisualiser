<?php

namespace models;

/**
 * Class UnemploymentDataPerAgeRange
 *
 * Represents the distribution of unemployed individuals across different age categories for a single county.
 * Maps to data extracted from 'varste.csv'.
 *
 * @package models
 */
class UnemploymentDataPerAgeRange
{
    /**
     * UnemploymentDataPerAgeRange constructor.
     *
     * @param string $county The name of the county (județ).
     * @param int $under25 Number of unemployed individuals aged under 25.
     * @param int $from25to29 Number of unemployed individuals aged between 25 and 29.
     * @param int $from30to39 Number of unemployed individuals aged between 30 and 39.
     * @param int $from40to49 Number of unemployed individuals aged between 40 and 49.
     * @param int $from50to59 Number of unemployed individuals aged between 50 and 59.
     * @param int $over50 Number of unemployed individuals aged over 50 (actually maps to the final category in the source, typically 55 or over, or simply the oldest demographic block).
     */
    public function __construct(
        public string $county,
        public int $under25,
        public int $from25to29,
        public int $from30to39,
        public int $from40to49,
        public int $from50to59,
        public int $over50
    ) {}
}