<?php
// api/categorias.php
require 'config.php';
require_once 'auth_middleware.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') requerirRol('admin');

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM categorias ORDER BY nombre ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $pdo->prepare("INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)");
        $stmt->execute([$data->nombre, $data->descripcion]);
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $pdo->prepare("UPDATE categorias SET nombre=?, descripcion=? WHERE id=?");
        $stmt->execute([$data->nombre, $data->descripcion, $data->id]);
        echo json_encode(["success" => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'];
        $stmt = $pdo->prepare("DELETE FROM categorias WHERE id=?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
        break;
}
?>
