<?php

/**
 * Class CacheSystem
 *
 * Implements a simple file-based caching mechanism to store API responses locally,
 * avoiding redundant external requests to data.gov.ro.
 */
class CacheSystem
{
    /**
     * @var string Directory path where cache files are stored.
     */
    private const string CACHE_DIR = __DIR__ . '/../cache';

    /**
     * @var int Default Cache lifetime in seconds (7 days).
     */
    private const int CACHE_LIFETIME = 7 * 24 * 60 * 60;

    /**
     * CacheSystem constructor.
     * Initializes the cache directory if it does not exist.
     */
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

    /**
     * Retrieve data from a cache file.
     *
     * @param string $name Name of the cache file.
     * @return string|null The content of the cache file, or null if it doesn't exist.
     */
    public function get(string $name): ?string
    {
        $cacheFile = self::CACHE_DIR . '/' . $name;
        if (file_exists($cacheFile)) {
            return file_get_contents($cacheFile);
        }
        return null;
    }
    
    /**
     * Store data into a cache file.
     *
     * @param string $name Name of the cache file.
     * @param string $content Content to be written to the cache file.
     * @return void
     */
    public function put(string $name, string $content): void
    {
        $cacheFile = self::CACHE_DIR . '/' . $name;
        @file_put_contents($cacheFile, $content);
    }
}
