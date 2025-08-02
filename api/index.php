<?php
@header("Content-type:application/json");
EnableCORS();
require_once "config.php";

// Cache configuration
const CACHE_FILE = __DIR__ . '/cache/cctv_data.json';
const CACHE_DURATION = 60*60; // 1 hour
$isForce = (@$_GET['force'] == true);

// Function definitions first
function EnableCORS() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: OPTIONS, GET, POST");
    header("Access-Control-Allow-Headers: Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control");
}

function transformCCTVData(array $cctv): array {
    // Parse location data with validation
    $latlon = $cctv['Lokasi CCTV (latitude,longitude)'] ?? '';
    $coordinates = explode(",", $latlon);

    if (count($coordinates) !== 2) {
        $lat = $lon = 0; // Default values for invalid coordinates
    } else {
        $lat = (float) trim($coordinates[0]);
        $lon = (float) trim($coordinates[1]);
    }

    // Create optimized transformation mapping
    $keyMapping = [
        'Tipe' => 'type',
        'Nama CCTV' => 'name',
        'Tautan/URL CCTV' => 'url',
        'Kota' => 'city',
        'Kategori/Tag' => 'tag',
        'Status' => 'status',
        'Keterangan' => 'note'
    ];

    // Build new array with transformed keys and location data
    $transformed = [
        'location' => [
            'latitude' => $lat,
            'longitude' => $lon,
            'address' => $cctv['Alamat Lengkap'] ?? '',
            'city' => strtoupper($cctv['Kota/Area/Wilayah'])
        ]
    ];

    // Apply key transformations efficiently
    foreach ($keyMapping as $oldKey => $newKey) {
        if (isset($cctv[$oldKey])) {
            $transformed[$newKey] = $cctv[$oldKey];
            if ($newKey == 'city') $transformed['city'] = strtoupper($transformed['city']);
            if ($newKey == 'type'){
                if ($transformed['type'] == 'Web Link') $transformed['type'] = 'http';
            }
        }
    }

    return $transformed;
}

function getCachedData(): ?array {
    if (!file_exists(CACHE_FILE)) {
        return null;
    }

    $cacheTime = filemtime(CACHE_FILE);
    if (time() - $cacheTime > CACHE_DURATION) {
        return null; // Cache expired
    }

    $cachedContent = file_get_contents(CACHE_FILE);
    return $cachedContent ? json_decode($cachedContent, true) : null;
}

function setCachedData(array $data): void {
    $cacheDir = dirname(CACHE_FILE);
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }

    file_put_contents(CACHE_FILE, json_encode($data));
}

function sendErrorResponse(string $message, int $httpCode = 500): void {
    http_response_code($httpCode);
    echo json_encode(['error' => $message]);
    exit;
}

// Main execution with error handling
try {
    // Check cache first
    if (!$isForce){
        $cachedData = getCachedData();
        if ($cachedData !== null) {
            echo json_encode($cachedData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    // Fetch CCTV data with error handling
    $cctvList = @file_get_contents(URL);

    if ($cctvList === false) {
        sendErrorResponse('Failed to fetch CCTV data from external API', 503);
    }

    $cctvData = json_decode($cctvList, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendErrorResponse('Invalid JSON response from external API', 502);
    }

    if (!isset($cctvData['data']) || !is_array($cctvData['data'])) {
        sendErrorResponse('Invalid data structure from external API', 502);
    }

    // Transform data efficiently
    $formatted = [];
    foreach ($cctvData['data'] as $cctv) {
        if (is_array($cctv)) {
            $formatted[] = transformCCTVData($cctv);
        }
    }

    // Cache and return response
    $response = ['data' => $formatted];
    setCachedData($response);
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    sendErrorResponse('Internal server error: ' . $e->getMessage(), 500);
} catch (Error $e) {
    sendErrorResponse('Fatal error occurred', 500);
}
