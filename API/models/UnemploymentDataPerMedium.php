<?php

namespace models;

/**
 * Class UnemploymentDataPerMedium
 *
 * Represents the distribution of unemployed individuals by environment (Urban vs. Rural) and gender for a single county.
 * Maps to data extracted from 'medii.csv'.
 *
 * @package models
 */
class UnemploymentDataPerMedium
{
    /**
     * UnemploymentDataPerMedium constructor.
     *
     * @param string $county The name of the county (județ).
     * @param int $totalUnemployed Total number of unemployed individuals.
     * @param int $totalFemaleUnemployed Total number of unemployed females.
     * @param int $totalMaleUnemployed Total number of unemployed males.
     * @param int $totalUnemployedUrban Total number of unemployed individuals in urban environments.
     * @param int $totalFemaleUnemployedUrban Number of unemployed females in urban environments.
     * @param int $totalMaleUnemployedUrban Number of unemployed males in urban environments.
     * @param int $totalUnemployedRural Total number of unemployed individuals in rural environments.
     * @param int $totalFemaleUnemployedRural Number of unemployed females in rural environments.
     * @param int $totalMaleUnemployedRural Number of unemployed males in rural environments.
     */
    public function __construct(
        public string $county,
        public int $totalUnemployed,
        public int $totalFemaleUnemployed,
        public int $totalMaleUnemployed,
        public int $totalUnemployedUrban,
        public int $totalFemaleUnemployedUrban,
        public int $totalMaleUnemployedUrban,
        public int $totalUnemployedRural,
        public int $totalFemaleUnemployedRural,
        public int $totalMaleUnemployedRural
    ) {}
}