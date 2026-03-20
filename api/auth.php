<?php
// Reportar todos los errores fatales a la vista (Modo Depuración Activo)
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
require_once 'config.php';

// Cabecera estricta ordenando salida JSON
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// 1. Capturar el Payload raw/crudo desde el Fetch API de Vue
$data = json_decode(file_get_contents('php://input'), true);

$tipo = $data['tipo'] ?? '';
$password = $data['password'] ?? '';

if (empty($tipo) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan credenciales institucionales.']);
    exit;
}

try {
    $stmt = null;

    if ($tipo === 'admin') {
        // En Vue enviamos "documento" como identificador maestro, puede cruzar con email si configuramos así
        $adminLogin = $data['documento'] ?? '';
        // Búsqueda usando las columnas confirmadas en DB física: documento o email
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE (documento = ? OR email = ?) AND rol = 'admin'");
        $stmt->execute([$adminLogin, $adminLogin]);
    } else {
        // Búsqueda cruzando la columna nativa 'email' para estudiantes
        $email = $data['email'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ? AND rol = 'lector'");
        $stmt->execute([$email]);
    }

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. MODO DEBUG: Validaciones separadas para develar el problema exacto
    if (!$usuario) {
        http_response_code(401);
        echo json_encode(['error' => '[DEBUG] Usuario no encontrado en la base de datos. Verifica que el correo o documento ingresado exista en tu tabla de usuarios en phpMyAdmin.']);
        exit;
    }

    if (!password_verify($password, $usuario['password'])) {
        http_response_code(401);
        echo json_encode(['error' => '[DEBUG] El usuario existe, pero la contraseña ingresada no coincide con el Hash guardado. Por favor, usa generar_hash.php para obtener un código válido y pégalo en la BD.']);
        exit;
    }
        
    $_SESSION['rol'] = $usuario['rol'];
    $_SESSION['idUsuario'] = $usuario['idUsuario'];

    unset($usuario['password']); 
    
    echo json_encode([
        'success' => true,
        'rol' => $usuario['rol'],
        'usuario' => [
            'id' => $usuario['idUsuario'],
            'nombre' => $usuario['nombre'], // Columna nativa
            'email' => $usuario['email'], // Columna nativa
            'rol' => $usuario['rol']
        ]
    ]);

} catch (PDOException $e) {
    // 3. Captura impecable devolviendo mensaje real en JSON
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Excepción SQL en backend: ' . $e->getMessage()]);
}
?>
