<?php

namespace models;

//Fallback Unemployment Data Display
use JsonSerializable;

class UnemploymentDataBasic implements JsonSerializable
{
    // Using PHP 8+ constructor property promotion for a more concise DTO.
    /**
     * @param string $county
     * @param int $nrUnemployed
     * @param int $nrFemaleUnemployed
     * @param int $nrMaleUnemployed
     * @param int $nrCompensatedUnemployed
     * @param int $nrNonCompensatedUnemployed
     * @param float $unemploymentRate
     * @param float $femaleUnemploymentRate
     * @param float $maleUnemploymentRate
     */
    public function __construct(
        private string $county,
        private int $nrUnemployed, // Changed from float, as it's a count of people.
        private int $nrFemaleUnemployed,
        private int $nrMaleUnemployed,
        private int $nrCompensatedUnemployed,
        private int $nrNonCompensatedUnemployed,
        private float $unemploymentRate,
        private float $femaleUnemploymentRate,
        private float $maleUnemploymentRate
    )
    {
    }

    public function getCounty(): string
    {
        return $this->county;
    }

    public function getNrUnemployed(): int
    {
        return $this->nrUnemployed;
    }

    public function getNrFemaleUnemployed(): int
    {
        return $this->nrFemaleUnemployed;
    }

    public function getNrMaleUnemployed(): int
    {
        return $this->nrMaleUnemployed;
    }

    public function getNrCompensatedUnemployed(): int
    {
        return $this->nrCompensatedUnemployed;
    }

    public function getNrNonCompensatedUnemployed(): int
    {
        return $this->nrNonCompensatedUnemployed;
    }

    public function getUnemploymentRate(): float
    {
        return $this->unemploymentRate;
    }

    public function getFemaleUnemploymentRate(): float
    {
        return $this->femaleUnemploymentRate;
    }

    public function getMaleUnemploymentRate(): float
    {
        return $this->maleUnemploymentRate;
    }

    /**
     * Specify data which should be serialized to JSON
     */
    public function jsonSerialize(): array
    {
        return get_object_vars($this);
    }
}