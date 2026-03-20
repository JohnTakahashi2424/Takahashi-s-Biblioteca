<?php
// api/usuarios.php
require 'config.php';
require_once 'auth_middleware.php';
header('Content-Type: application/json');

requerirRol('admin');
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Alinear al nuevo esquema y filtrar al administrador
        $stmt = $pdo->query("SELECT idUsuario, documento, nombre, email, telefono FROM usuarios WHERE rol = 'lector' ORDER BY idUsuario DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        if (isset($_GET['importar'])) {
            if (!isset($_FILES['csv']) || $_FILES['csv']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400); echo json_encode(["error" => "Error al subir el CSV."]); exit;
            }
            $file = fopen($_FILES['csv']['tmp_name'], 'r');
            $count = 0;
            fgetcsv($file); // Cabecera
            while (($row = fgetcsv($file)) !== false) {
                if (count($row) >= 2) {
                    $documento = trim($row[0]);
                    $nombre = trim($row[1]);
                    $email = isset($row[2]) ? trim($row[2]) : $documento.'@biblioteca.local';
                    $telefono = isset($row[3]) ? trim($row[3]) : null;
                    $rol = 'lector';
                    
                    $stmtCheck = $pdo->prepare("SELECT idUsuario FROM usuarios WHERE documento=? OR email=?");
                    $stmtCheck->execute([$documento, $email]);
                    if ($stmtCheck->rowCount() == 0) {
                        $password = password_hash($documento, PASSWORD_BCRYPT);
                        $stmt = $pdo->prepare("INSERT INTO usuarios (documento, nombre, email, password, rol, telefono) VALUES (?, ?, ?, ?, ?, ?)");
                        $stmt->execute([$documento, $nombre, $email, $password, $rol, $telefono]);
                        $count++;
                    }
                }
            }
            fclose($file);
            echo json_encode(["success" => true, "aviso" => "Se importaron $count usuarios correctamente."]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));
        // Simulando que el admin crea al usuario: la contraseña es el documento de identidad por defecto
        $password = password_hash($data->documento, PASSWORD_BCRYPT); 
        $stmt = $pdo->prepare("INSERT INTO usuarios (documento, nombre, email, password, rol, telefono) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data->documento, $data->nombre, $data->email, $password, 'lector', $data->telefono ?? null]);
        echo json_encode(["success" => true, "idUsuario" => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $idUsuario = $data->idUsuario ?? $data->id;
        $stmt = $pdo->prepare("UPDATE usuarios SET documento=?, nombre=?, email=?, telefono=? WHERE idUsuario=?");
        $stmt->execute([$data->documento, $data->nombre, $data->email, $data->telefono ?? null, $idUsuario]);
        echo json_encode(["success" => true]);
        break;

    case 'DELETE':
        $idUsuario = $_GET['id'] ?? $_GET['idUsuario'];
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE idUsuario=?");
        $stmt->execute([$idUsuario]);
        echo json_encode(["success" => true]);
        break;
}
?>
