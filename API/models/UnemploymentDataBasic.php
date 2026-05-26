<?php

namespace models;

/**
 * Class UnemploymentDataBasic
 * 
 * Represents the general (basic) unemployment statistics for a single county.
 * Maps to data extracted from 'rata.csv'.
 * 
 * @package models
 */
class UnemploymentDataBasic
{
    /**
     * UnemploymentDataBasic constructor.
     *
     * @param string $county The name of the county (județ).
     * @param int $nrUnemployed Total number of unemployed individuals.
     * @param int $nrFemaleUnemployed Number of unemployed females.
     * @param int $nrMaleUnemployed Number of unemployed males.
     * @param int $nrCompensatedUnemployed Number of unemployed individuals receiving unemployment compensation.
     * @param int $nrNonCompensatedUnemployed Number of unemployed individuals not receiving compensation.
     * @param float $unemploymentRate General unemployment rate (percentage).
     * @param float $femaleUnemploymentRate Female unemployment rate (percentage).
     * @param float $maleUnemploymentRate Male unemployment rate (percentage).
     */
    public function __construct(
        public string $county,
        public int $nrUnemployed,
        public int $nrFemaleUnemployed,
        public int $nrMaleUnemployed,
        public int $nrCompensatedUnemployed,
        public int $nrNonCompensatedUnemployed,
        public float $unemploymentRate,
        public float $femaleUnemploymentRate,
        public float $maleUnemploymentRate
    ) {}
}