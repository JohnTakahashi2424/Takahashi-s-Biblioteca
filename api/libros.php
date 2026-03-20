<?php
// api/libros.php
require 'config.php';
require_once 'auth_middleware.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') requerirRol('admin');

switch ($method) {
    case 'GET':
        // Hacemos JOIN con categorias para enviar el nombre directo si es necesario
        $stmt = $pdo->query("SELECT l.*, c.nombre as categoria_nombre FROM libros l LEFT JOIN categorias c ON l.categoria_id = c.id ORDER BY l.titulo ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $pdo->prepare("INSERT INTO libros (titulo, autor, categoria_id, isbn, stock_total, stock_disponible, portada_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data->titulo, $data->autor, $data->categoria_id, $data->isbn, $data->stock_total, $data->stock_total, $data->portada_url]);
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $pdo->prepare("UPDATE libros SET titulo=?, autor=?, categoria_id=?, isbn=?, stock_total=?, portada_url=? WHERE id=?");
        $stmt->execute([$data->titulo, $data->autor, $data->categoria_id, $data->isbn, $data->stock_total, $data->portada_url, $data->id]);
        echo json_encode(["success" => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'];
        $stmt = $pdo->prepare("DELETE FROM libros WHERE id=?");
        try {
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
        } catch(PDOException $e) {
            http_response_code(409);
            echo json_encode(["error" => "No se puede borrar un libro que tiene historial de préstamos."]);
        }
        break;
}
?>
