<?php
/**
 * DigitalHands.in — Shared config
 * Place this file OUTSIDE your public_html if possible.
 */

define('DH_VERSION', '1.0.0');
define('DH_SITE_NAME', 'DigitalHands.in');

// Session settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

// CORS — tighten for production
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Helper
function json_out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function json_err($msg, $code = 400) {
    json_out(['success' => false, 'error' => $msg], $code);
}

// Simple CSRF guard for POST
function csrf_check() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host   = $_SERVER['HTTP_HOST']   ?? '';
    if ($origin && parse_url($origin, PHP_URL_HOST) !== $host) {
        json_err('CSRF check failed', 403);
    }
}
