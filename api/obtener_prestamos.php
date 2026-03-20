<?php
require_once 'config.php';

try {
    $usuario_id = $_GET['usuario_id'] ?? null;
    $rol = $_GET['rol'] ?? 'lector';
    
    $query = "
        SELECT 
            p.idPrestamo, 
            p.idUsuario, 
            p.idLibro, 
            p.fecha_prestamo, 
            p.fecha_vencimiento, 
            p.estado,
            u.nombre AS usuario_nombre, 
            u.documento, 
            l.titulo AS libro_titulo 
        FROM prestamos p
        INNER JOIN usuarios u ON p.idUsuario = u.idUsuario
        INNER JOIN libros l ON p.idLibro = l.idLibro
    ";
    
    if ($rol !== 'admin' && $usuario_id) {
        $query .= " WHERE p.idUsuario = :usuario_id";
    }
    
    $query .= " ORDER BY p.fecha_prestamo DESC";
    
    $stmt = $pdo->prepare($query);
    
    if ($rol !== 'admin' && $usuario_id) {
        $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
    }
    
    $stmt->execute();
    $prestamos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($prestamos);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno: " . $e->getMessage()]);
}
?>
