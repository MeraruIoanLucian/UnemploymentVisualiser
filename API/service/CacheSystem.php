<?php

class CacheSystem
{
    private const string CACHE_DIR = __DIR__ . '/../cache';
    private const int CACHE_LIFETIME = 7 * 24 * 60 * 60; // 7 days in seconds

    public function __construct()
    {
        if (!is_dir(self::CACHE_DIR)) {
            @mkdir(self::CACHE_DIR, 0777, true);
        }
    }

    /**
     * Clean cache files older than the specified lifetime.
     *
     * @param int $lifetime Lifetime in seconds
     * @return void
     */
    public function cleanExpired(int $lifetime = self::CACHE_LIFETIME): void
    {
        if (is_dir(self::CACHE_DIR)) {
            foreach (scandir(self::CACHE_DIR) as $file) {
                if ($file !== '.' && $file !== '..') {
                    $filePath = self::CACHE_DIR . '/' . $file;
                    if (is_file($filePath) && filemtime($filePath) < (time() - $lifetime)) {
                        @unlink($filePath);
                    }
                }
            }
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
}
