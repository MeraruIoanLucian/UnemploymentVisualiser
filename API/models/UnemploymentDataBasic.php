<?php

namespace models;

class UnemploymentDataBasic
{
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