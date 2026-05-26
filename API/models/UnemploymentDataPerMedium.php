<?php

namespace models;

class UnemploymentDataPerMedium
{
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