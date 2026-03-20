<?php
// api/config.php

// 1. Manejo estricto de CORS y Cabeceras
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Credenciales de la Base de Datos (XAMPP por defecto)
$host = 'localhost';
$db   = 'biblioteca_Takahashi'; // Nombre exacto al que renombraste en el SQL
$user = 'root';
$pass = '';

try {
    // 3. Conexión PDO Segura
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    
    // Configuración de reporte de errores y modo de extracción
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    // 4. Captura del Error Real y Retorno en formato JSON
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Error de Conexión SQL: " . $e->getMessage()
    ]);
    exit;
}
?>
