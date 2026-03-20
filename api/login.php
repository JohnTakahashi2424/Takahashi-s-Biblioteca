<?php
// api/login.php
require 'config.php';

// Obtener los datos JSON que enviará Vue.js
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["error" => "Por favor, ingresa correo y contraseña."]);
    exit;
}

$stmt = $pdo->prepare("SELECT idUsuario, documento, nombre, email, password, rol FROM usuarios WHERE email = ? OR documento = ? LIMIT 1");
$stmt->execute([$data->email, $data->email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// password_verify() compara la clave en texto plano con el HASH guardado en la BD
if ($user && password_verify($data->password, $user['password'])) {
    
    // NUNCA devolvemos la contraseña al front-end
    unset($user['password']); 
    
    // Generar un token JWT real con expiración de 24 horas
    require_once 'jwt.php';
    $payload = [
        'id' => $user['idUsuario'], // Usando idUsuario como identificador JWT
        'rol' => $user['rol'],
        'nombre' => $user['nombre'],
        'iat' => time(),
        'exp' => time() + (60 * 60 * 24) // Expira en 24h
    ];
    $token = JWT::encode($payload); 
    
    echo json_encode([
        "success" => true,
        "token" => $token,
        "usuario" => [
            "id" => $user['idUsuario'],
            "documento" => $user['documento'],
            "nombre" => $user['nombre'],
            "email" => $user['email'],
            "rol" => $user['rol']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Credenciales institucionales incorrectas, revisa tu usuario/contraseña."]);
}
?>
