<?php

namespace models;

use JsonSerializable;

class UnemploymentDataPerAgeRange implements JsonSerializable
{
    private string $county;
    private int $under25;
    private int $from25to29;
    private int $from30to39;
    private int $from40to49;
    private int $from50to59;
    private int $over50;

    /**
     * @param string $county
     * @param int $under25
     * @param int $from25to29
     * @param int $from30to39
     * @param int $from40to49
     * @param int $from50to59
     * @param int $over50
     */
    public function __construct( string $county, int $under25, int $from25to29, int $from30to39, int $from40to49, int $from50to59, int $over50)
    {
        $this->county = $county;
        $this->under25 = $under25;
        $this->from25to29 = $from25to29;
        $this->from30to39 = $from30to39;
        $this->from40to49 = $from40to49;
        $this->from50to59 = $from50to59;
        $this->over50 = $over50;
    }

    public function getCounty(): string
    {
        return $this->county;
    }

    public function setCounty(string $county): void
    {
        $this->county = $county;
    }

    public function getUnder25(): int
    {
        return $this->under25;
    }

    public function setUnder25(int $under25): void
    {
        $this->under25 = $under25;
    }

    public function getFrom25to29(): int
    {
        return $this->from25to29;
    }

    public function setFrom25to29(int $from25to29): void
    {
        $this->from25to29 = $from25to29;
    }

    public function getFrom30to39(): int
    {
        return $this->from30to39;
    }

    public function getFrom40to49(): int
    {
        return $this->from40to49;
    }


    public function getFrom50to59(): int
    {
        return $this->from50to59;
    }


    public function getOver50(): int
    {
        return $this->over50;
    }

    public function jsonSerialize(): array
    {
        return get_object_vars($this);
    }
}