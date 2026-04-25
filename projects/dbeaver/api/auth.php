<?php
/**
 * DigitalHands.in — Auth endpoint
 *
 * POST /api/auth.php
 * Body: { "action": "admin_login"|"client_login"|"logout"|"me",
 *         "email": "...", "password": "..." }
 *
 * All passwords in users.json are bcrypt hashes.
 * Default password for all accounts: "password"  (change in production!)
 * To generate a new hash: password_hash('yourpassword', PASSWORD_BCRYPT)
 */

require_once __DIR__ . '/config.php';

session_start();

$users_file = __DIR__ . '/users.json';
$users      = json_decode(file_get_contents($users_file), true);

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $body['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    /* ── Admin login ── */
    case 'admin_login':
        $email    = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';
        if (!$email || !$password) json_err('Email and password required.');

        $admin = null;
        foreach ($users['admins'] as $a) {
            if ($a['email'] === $email) { $admin = $a; break; }
        }

        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            json_err('Invalid credentials.', 401);
        }

        session_regenerate_id(true);
        $_SESSION['dh_auth']   = true;
        $_SESSION['dh_role']   = 'admin';
        $_SESSION['dh_user']   = ['id' => $admin['id'], 'name' => $admin['name'],
                                   'email' => $admin['email'], 'role' => $admin['role']];

        json_out(['success' => true, 'user' => $_SESSION['dh_user'], 'redirect' => '../admin/dashboard.html']);
        break;

    /* ── Client login ── */
    case 'client_login':
        $email    = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';
        if (!$email || !$password) json_err('Email and password required.');

        $client = null;
        foreach ($users['clients'] as $c) {
            if ($c['login_email'] === $email) { $client = $c; break; }
        }

        if (!$client || !password_verify($password, $client['password_hash'])) {
            json_err('Invalid credentials.', 401);
        }

        session_regenerate_id(true);
        $_SESSION['dh_auth']   = true;
        $_SESSION['dh_role']   = 'client';
        $_SESSION['dh_user']   = [
            'id'     => $client['id'],
            'name'   => $client['name'],
            'email'  => $client['login_email'],
            'domain' => $client['domain'],
            'plan'   => $client['plan'],
        ];

        json_out(['success' => true, 'user' => $_SESSION['dh_user'], 'redirect' => '../client/dashboard.html']);
        break;

    /* ── Logout ── */
    case 'logout':
        session_destroy();
        json_out(['success' => true]);
        break;

    /* ── Me (session check) ── */
    case 'me':
        if (!empty($_SESSION['dh_auth'])) {
            json_out(['success' => true, 'user' => $_SESSION['dh_user'], 'role' => $_SESSION['dh_role']]);
        } else {
            json_out(['success' => false, 'authenticated' => false], 401);
        }
        break;

    /* ── Change password ── */
    case 'change_password':
        if (empty($_SESSION['dh_auth'])) json_err('Not authenticated.', 401);
        $new = $body['new_password'] ?? '';
        if (strlen($new) < 6) json_err('Password must be at least 6 characters.');

        $hash = password_hash($new, PASSWORD_BCRYPT);
        $role = $_SESSION['dh_role'];
        $id   = $_SESSION['dh_user']['id'];

        $key = $role === 'admin' ? 'admins' : 'clients';
        foreach ($users[$key] as &$u) {
            if ($u['id'] === $id) { $u['password_hash'] = $hash; break; }
        }
        file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));
        json_out(['success' => true, 'message' => 'Password updated.']);
        break;

    default:
        json_err('Unknown action.', 404);
}
