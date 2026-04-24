<?php
/**
 * DigitalHands.in — Clients CRUD (admin only)
 *
 * GET    /api/clients.php             → list all clients
 * POST   /api/clients.php             → create client  { action:'create', ...fields }
 * PUT    /api/clients.php             → update client  { action:'update', id, ...fields }
 * DELETE /api/clients.php             → delete client  { action:'delete', id }
 */

require_once __DIR__ . '/config.php';
session_start();

// Admin-only guard
if (empty($_SESSION['dh_auth']) || $_SESSION['dh_role'] !== 'admin') {
    json_err('Unauthorized.', 403);
}

$users_file = __DIR__ . '/users.json';
$users      = json_decode(file_get_contents($users_file), true);
$method     = $_SERVER['REQUEST_METHOD'];
$body       = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($method) {
    case 'GET':
        // Strip password hashes before sending to browser
        $safe = array_map(function($c) {
            unset($c['password_hash']);
            return $c;
        }, $users['clients']);
        json_out(['success' => true, 'clients' => $safe]);
        break;

    case 'POST':
        $action = $body['action'] ?? 'create';
        if ($action === 'create') {
            $required = ['name', 'login_email', 'password'];
            foreach ($required as $f) {
                if (empty($body[$f])) json_err("Field '$f' is required.");
            }
            $new = [
                'id'            => 'cli_' . time(),
                'name'          => htmlspecialchars($body['name']),
                'contact'       => htmlspecialchars($body['contact'] ?? ''),
                'email'         => strtolower(trim($body['email'] ?? '')),
                'phone'         => htmlspecialchars($body['phone'] ?? ''),
                'domain'        => strtolower(trim($body['domain'] ?? '')),
                'template'      => $body['template'] ?? 'spa-massage',
                'status'        => 'active',
                'plan'          => $body['plan'] ?? 'Starter',
                'created'       => date('Y-m-d'),
                'login_email'   => strtolower(trim($body['login_email'])),
                'password_hash' => password_hash($body['password'], PASSWORD_BCRYPT),
            ];
            $users['clients'][] = $new;
            file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));
            unset($new['password_hash']);
            json_out(['success' => true, 'client' => $new], 201);
        }
        json_err('Unknown action.');
        break;

    case 'PUT':
        $id = $body['id'] ?? '';
        if (!$id) json_err('Client ID required.');
        $idx = null;
        foreach ($users['clients'] as $i => $c) {
            if ($c['id'] === $id) { $idx = $i; break; }
        }
        if ($idx === null) json_err('Client not found.', 404);

        $allowed = ['name','contact','email','phone','domain','template','status','plan','login_email'];
        foreach ($allowed as $f) {
            if (isset($body[$f])) $users['clients'][$idx][$f] = htmlspecialchars($body[$f]);
        }
        if (!empty($body['password'])) {
            $users['clients'][$idx]['password_hash'] = password_hash($body['password'], PASSWORD_BCRYPT);
        }
        file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));
        $safe = $users['clients'][$idx]; unset($safe['password_hash']);
        json_out(['success' => true, 'client' => $safe]);
        break;

    case 'DELETE':
        $id = $body['id'] ?? $_GET['id'] ?? '';
        if (!$id) json_err('Client ID required.');
        $before = count($users['clients']);
        $users['clients'] = array_values(array_filter($users['clients'], fn($c) => $c['id'] !== $id));
        if (count($users['clients']) === $before) json_err('Client not found.', 404);
        file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));
        json_out(['success' => true]);
        break;

    default:
        json_err('Method not allowed.', 405);
}
