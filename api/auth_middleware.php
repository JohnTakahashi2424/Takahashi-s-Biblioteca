<?php
// api/auth_middleware.php
require_once 'jwt.php';

function verificarToken() {
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(['error' => 'No se proporcionó token de autorización.']);
        exit;
    }

    $tokenParts = explode(' ', $authHeader);
    if (count($tokenParts) != 2 || strcasecmp($tokenParts[0], 'Bearer') !== 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Formato de token inválido. Use: Bearer <token>']);
        exit;
    }

    $token = $tokenParts[1];
    $decoded = JWT::decode($token);

    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado.']);
        exit;
    }

    return $decoded; // Retorna el payload del JWT (id, rol, etc)
}

function requerirRol($rolEsperado) {
    $userData = verificarToken();
    if ($userData['rol'] !== $rolEsperado) {
        http_response_code(403);
        echo json_encode(['error' => 'Acceso denegado. No tienes permisos para realizar esta acción.']);
        exit;
    }
    return $userData;
}

// Habilitar chequeos si este archivo es importado sin llamar explícitamente a las funciones:
// Generalmente `verificarToken()` se llamará dentro de cada endpoint.
?>
