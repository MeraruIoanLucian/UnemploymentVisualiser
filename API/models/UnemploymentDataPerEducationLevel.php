<?php

namespace models;

class UnemploymentDataPerEducationLevel
{
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