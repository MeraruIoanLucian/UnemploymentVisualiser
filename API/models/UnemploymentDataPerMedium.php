<?php

namespace models;

use JsonSerializable;

class UnemploymentDataPerMedium implements JsonSerializable
{
    private string $county;
    private int $totalUnemployed;
    private int $totalFemaleUnemployed;
    private int $totalMaleUnemployed;
    private int $totalUnemployedUrban;
    private int $totalFemaleUnemployedUrban;
    private int $totalMaleUnemployedUrban;
    private int $totalUnemployedRural;
    private int $totalFemaleUnemployedRural;
    private int $totalMaleUnemployedRural;

    /**
     * @param string $county
     * @param int $totalUnemployed
     * @param int $totalFemaleUnemployed
     * @param int $totalMaleUnemployed
     * @param int $totalUnemployedUrban
     * @param int $totalFemaleUnemployedUrban
     * @param int $totalMaleUnemployedUrban
     * @param int $totalUnemployedRural
     * @param int $totalFemaleUnemployedRural
     * @param int $totalMaleUnemployedRural
     */
    public function __construct(string $county, int $totalUnemployed, int $totalFemaleUnemployed, int $totalMaleUnemployed, int $totalUnemployedUrban, int $totalFemaleUnemployedUrban, int $totalMaleUnemployedUrban, int $totalUnemployedRural, int $totalFemaleUnemployedRural, int $totalMaleUnemployedRural)
    {
        $this->county = $county;
        $this->totalUnemployed = $totalUnemployed;
        $this->totalFemaleUnemployed = $totalFemaleUnemployed;
        $this->totalMaleUnemployed = $totalMaleUnemployed;
        $this->totalUnemployedUrban = $totalUnemployedUrban;
        $this->totalFemaleUnemployedUrban = $totalFemaleUnemployedUrban;
        $this->totalMaleUnemployedUrban = $totalMaleUnemployedUrban;
        $this->totalUnemployedRural = $totalUnemployedRural;
        $this->totalFemaleUnemployedRural = $totalFemaleUnemployedRural;
        $this->totalMaleUnemployedRural = $totalMaleUnemployedRural;
    }


    public function getCounty(): string
    {
        return $this->county;
    }

    public function getTotalUnemployed(): int
    {
        return $this->totalUnemployed;
    }

    public function getTotalFemaleUnemployed(): int
    {
        return $this->totalFemaleUnemployed;
    }

    public function getTotalMaleUnemployed(): int
    {
        return $this->totalMaleUnemployed;
    }

    public function getTotalUnemployedUrban(): int
    {
        return $this->totalUnemployedUrban;
    }

    public function getTotalFemaleUnemployedUrban(): int
    {
        return $this->totalFemaleUnemployedUrban;
    }

    public function getTotalMaleUnemployedUrban(): int
    {
        return $this->totalMaleUnemployedUrban;
    }

    public function getTotalUnemployedRural(): int
    {
        return $this->totalUnemployedRural;
    }

    public function getTotalFemaleUnemployedRural(): int
    {
        return $this->totalFemaleUnemployedRural;
    }

    public function getTotalMaleUnemployedRural(): int
    {
        return $this->totalMaleUnemployedRural;
    }

    public function jsonSerialize(): array
    {
        return get_object_vars($this);
    }
}