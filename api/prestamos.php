<?php
// api/prestamos.php
require 'config.php';
require_once 'auth_middleware.php';
header('Content-Type: application/json');

$userData = verificarToken();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if ($userData['rol'] === 'admin') {
            $stmt = $pdo->query("SELECT p.*, l.titulo as libro_titulo, u.nombre as usuario_nombre FROM prestamos p JOIN libros l ON p.libro_id = l.id JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.fecha_registro DESC");
            echo json_encode($stmt->fetchAll());
        } else {
            $stmt = $pdo->prepare("SELECT p.*, l.titulo as libro_titulo, u.nombre as usuario_nombre FROM prestamos p JOIN libros l ON p.libro_id = l.id JOIN usuarios u ON p.usuario_id = u.id WHERE p.usuario_id = ? ORDER BY p.fecha_registro DESC");
            $stmt->execute([$userData['id']]);
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST': // Auto-Préstamo o Préstamo Manual
        $data = json_decode(file_get_contents("php://input"));
        
        try {
            $pdo->beginTransaction();
            
            // 1. Verificar Disponibilidad Real Exclusiva (Evita colisiones)
            $stmt = $pdo->prepare("SELECT stock_disponible FROM libros WHERE id = ? FOR UPDATE");
            $stmt->execute([$data->libro_id]);
            $libro = $stmt->fetch();
            
            if (!$libro || $libro['stock_disponible'] <= 0) {
                http_response_code(400);
                echo json_encode(["error" => "El libro se encuentra agotado."]);
                $pdo->rollBack();
                exit;
            }
            
            // 2. Insertar Préstamo
            $stmtInsert = $pdo->prepare("INSERT INTO prestamos (usuario_id, libro_id, fecha_inicio, fecha_vencimiento) VALUES (?, ?, ?, ?)");
            $stmtInsert->execute([$data->usuario_id, $data->libro_id, $data->fecha_inicio, $data->fecha_vencimiento]);
            $prestamoId = $pdo->lastInsertId();
            
            // 3. Descontar Stock
            $stmtUpdate = $pdo->prepare("UPDATE libros SET stock_disponible = stock_disponible - 1 WHERE id = ?");
            $stmtUpdate->execute([$data->libro_id]);
            
            $pdo->commit();
            echo json_encode(["success" => true, "id" => $prestamoId]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Error procesando el préstamo."]);
        }
        break;

    case 'PUT': // Devolución de libro o Guardar Anotación
        $data = json_decode(file_get_contents("php://input"));
        
        if (isset($data->anotaciones)) {
            // Es una actualización de anotación desde Mi Estante
            $stmt = $pdo->prepare("UPDATE prestamos SET anotaciones=? WHERE id=?");
            $stmt->execute([$data->anotaciones, $data->id]);
            echo json_encode(["success" => true]);
        } 
        else if (isset($data->accion) && $data->accion === 'devolver') {
            // Es una devolución
            try {
                $pdo->beginTransaction();
                
                // Marcar como devuelto
                $stmt = $pdo->prepare("UPDATE prestamos SET estado='devuelto' WHERE id=?");
                $stmt->execute([$data->id]);
                
                // Recuperar libro_id para restaurar stock
                $stmtGet = $pdo->prepare("SELECT libro_id FROM prestamos WHERE id=?");
                $stmtGet->execute([$data->id]);
                $prestamo = $stmtGet->fetch();
                
                if($prestamo) {
                    $stmtStock = $pdo->prepare("UPDATE libros SET stock_disponible = stock_disponible + 1 WHERE id=?");
                    $stmtStock->execute([$prestamo['libro_id']]);
                }
                
                $pdo->commit();
                echo json_encode(["success" => true]);
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(["error" => "Error en devolución."]);
            }
        }
        break;
}
?>
