<?php

namespace models;

use JsonSerializable;

class CsvCacheEntry implements JsonSerializable
{

    private string $name;

    private int $size;
    private string $createdAt;

    /**
     * @param int $size
     * @param string $name
     * @param string $createdAt
     */
    public function __construct(int $size, string $name, string $createdAt)
    {
        $this->size = $size;
        $this->name = $name;
        $this->createdAt = $createdAt;
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function setSize(int $size): void
    {
        $this->size = $size;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function setCreatedAt(string $createdAt): void
    {
        $this->createdAt = $createdAt;
    }


    public function jsonSerialize(): array
    {
        return get_object_vars($this);
    }
}