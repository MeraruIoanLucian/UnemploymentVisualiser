<?php

use models\CsvCacheEntry;

require_once __DIR__ . "/../models/CsvCacheEntry.php";

class CacheSystem
{
    private const CACHE_DIR = __DIR__ . '/../cache';

    public function __construct()
    {
        if (!is_dir(self::CACHE_DIR)) {
            mkdir(self::CACHE_DIR, 0777, true);
        }
    }

    /**
     * @return CsvCacheEntry[]
     */
    public function getAll(): array
    {
        $cachedFiles = [];
        $files = scandir(self::CACHE_DIR);

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $filePath = self::CACHE_DIR . '/' . $file;
            if (is_file($filePath)) {
                $cachedFiles[] = new CsvCacheEntry(
                    filesize($filePath),
                    $file,
                    // Format timestamp into an ISO 8601 date string
                    date('c', filemtime($filePath))
                );
            }
        }

        return $cachedFiles;
    }

    public function getByName(string $name): ?CsvCacheEntry
    {
        $file_path = self::CACHE_DIR . '/' . $name;
        if (is_file($file_path)) {
            $cachedFile = new CsvCacheEntry(
                filesize($file_path),
                $name,
                // Format timestamp into an ISO 8601 date string
                date('c', filemtime($file_path))
            );
            return $cachedFile;
        } else {
            return null;
        }
    }

    public function get(string $name): ?string
    {
        $cacheFile = self::CACHE_DIR . '/' . $name;
        if (file_exists($cacheFile)) {
            return file_get_contents($cacheFile);
        }
        return null;
    }
    
    public function put(string $name, string $content): void
    {
        $cacheFile = self::CACHE_DIR . '/' . $name;
        @file_put_contents($cacheFile, $content);
    }

    public function delete(string $name): bool
    {
        $cacheFile = self::CACHE_DIR . '/' . $name;
        if (file_exists($cacheFile)) {
            return unlink($cacheFile);
        }
        return false;
    }

    public function clear(): void
    {
        $files = glob(self::CACHE_DIR . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        rmdir(self::CACHE_DIR);
    }
}
