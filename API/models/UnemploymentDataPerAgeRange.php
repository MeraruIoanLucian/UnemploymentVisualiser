<?php

namespace models;

class UnemploymentDataPerAgeRange
{
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