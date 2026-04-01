<?php

namespace models;

use JsonSerializable;

class UnemploymentDataPerEducationLevel implements JsonSerializable
{
    private string $county;
    private int $noStudy;
    private int $primaryStudy;
    private int $middleStudy;
    private int $highStudy;
    private int $postHighStudy;
    private int $professionalStudy;
    private int $universityStudy;

    /**
     * @param string $county
     * @param int $noStudy
     * @param int $primaryStudy
     * @param int $middleStudy
     * @param int $highStudy
     * @param int $postHighStudy
     * @param int $professionalStudy
     * @param int $universityStudy
     */
    public function __construct(string $county, int $noStudy, int $primaryStudy, int $middleStudy, int $highStudy, int $postHighStudy, int $professionalStudy, int $universityStudy)
    {
        $this->county = $county;
        $this->noStudy = $noStudy;
        $this->primaryStudy = $primaryStudy;
        $this->middleStudy = $middleStudy;
        $this->highStudy = $highStudy;
        $this->postHighStudy = $postHighStudy;
        $this->professionalStudy = $professionalStudy;
        $this->universityStudy = $universityStudy;
    }

    public function getCounty(): string
    {
        return $this->county;
    }

    public function setCounty(string $county): void
    {
        $this->county = $county;
    }

    public function getNoStudy(): int
    {
        return $this->noStudy;
    }

    public function setNoStudy(int $noStudy): void
    {
        $this->noStudy = $noStudy;
    }

    public function getPrimaryStudy(): int
    {
        return $this->primaryStudy;
    }

    public function setPrimaryStudy(int $primaryStudy): void
    {
        $this->primaryStudy = $primaryStudy;
    }

    public function getMiddleStudy(): int
    {
        return $this->middleStudy;
    }

    public function setMiddleStudy(int $middleStudy): void
    {
        $this->middleStudy = $middleStudy;
    }

    public function getHighStudy(): int
    {
        return $this->highStudy;
    }

    public function setHighStudy(int $highStudy): void
    {
        $this->highStudy = $highStudy;
    }

    public function getPostHighStudy(): int
    {
        return $this->postHighStudy;
    }

    public function setPostHighStudy(int $postHighStudy): void
    {
        $this->postHighStudy = $postHighStudy;
    }

    public function getProfessionalStudy(): int
    {
        return $this->professionalStudy;
    }

    public function setProfessionalStudy(int $professionalStudy): void
    {
        $this->professionalStudy = $professionalStudy;
    }

    public function getUniversityStudy(): int
    {
        return $this->universityStudy;
    }

    public function setUniversityStudy(int $universityStudy): void
    {
        $this->universityStudy = $universityStudy;
    }

    public function jsonSerialize(): array
    {
        return get_object_vars($this);
    }
}