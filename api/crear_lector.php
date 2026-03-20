<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// --- REGLA DE NEGOCIO ESTRICTA B2B2C ---
// Solo el Administrador Global autenticado en sesión puede ejecutar esta acción
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Acceso Denegado. Solo el Administrador de la Institución puede matricular nuevos lectores.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);
    exit;
}

// Analizar el cuerpo JSON
$data = json_decode(file_get_contents('php://input'), true);

$codigo_estudiante = trim($data['codigo_estudiante'] ?? '');
$nombre_completo = trim($data['nombre_completo'] ?? '');
$email = trim($data['email'] ?? '');
// Como regla, si no se le pasa contraseña, se le asigna su propio código como clave temporal
$password = trim($data['password'] ?? $codigo_estudiante);

if (!$codigo_estudiante || !$nombre_completo || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan campos obligatorios para generar la cuenta (código, nombre o email).']);
    exit;
}

try {
    // Encriptación Bcrypt mandatada por la arquitectura B2B2C
    $hash = password_hash($password, PASSWORD_BCRYPT);
    
    // El rol siempre se fuerza institucionalmente a 'lector'
    $stmt = $pdo->prepare("INSERT INTO usuarios (documento, nombre, email, password, rol) VALUES (?, ?, ?, ?, 'lector')");
    $stmt->execute([$codigo_estudiante, $nombre_completo, $email, $hash]);
    
    echo json_encode([
        'success' => true, 
        'mensaje' => 'Estudiante/Lector matriculado exitosamente en la biblioteca.'
    ]);

} catch (PDOException $e) {
    // Capturar error de índice duplicado (MySQL 1062 - SQLSTATE 23000)
    if ($e->getCode() == 23000) {
         http_response_code(409);
         echo json_encode(['error' => 'Error: Ya existe un registro con este Código de Estudiante o Correo Electrónico institucional.']);
    } else {
         http_response_code(500);
         echo json_encode(['error' => 'Excepción interna en la base de datos al matricular.']);
    }
}
?>
