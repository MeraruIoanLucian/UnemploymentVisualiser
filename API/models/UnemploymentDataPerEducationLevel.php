<?php

namespace models;

/**
 * Class UnemploymentDataPerEducationLevel
 *
 * Represents the distribution of unemployed individuals across different education levels for a single county.
 * Maps to data extracted from 'nivel-educatie.csv'.
 *
 * @package models
 */
class UnemploymentDataPerEducationLevel
{
    /**
     * UnemploymentDataPerEducationLevel constructor.
     *
     * @param string $county The name of the county (județ).
     * @param int $noStudy Number of unemployed individuals with no studies/education.
     * @param int $primaryStudy Number of unemployed individuals with primary education (învățământ primar).
     * @param int $middleStudy Number of unemployed individuals with middle school education (gimnazial).
     * @param int $highStudy Number of unemployed individuals with high school education (liceal).
     * @param int $postHighStudy Number of unemployed individuals with post-high school education (postliceal).
     * @param int $professionalStudy Number of unemployed individuals with vocational/professional school education (profesional/arte și meserii).
     * @param int $universityStudy Number of unemployed individuals with university/higher education (universitar).
     */
    public function __construct(
        public string $county,
        public int $noStudy,
        public int $primaryStudy,
        public int $middleStudy,
        public int $highStudy,
        public int $postHighStudy,
        public int $professionalStudy,
        public int $universityStudy
    ) {}
}