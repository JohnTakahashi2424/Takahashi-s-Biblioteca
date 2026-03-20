<?php
require_once 'config.php';

try {
    $stmt = $pdo->prepare("
        SELECT 
            l.idLibro, 
            l.titulo, 
            l.isbn, 
            l.anio_publicacion, 
            l.estado, 
            l.idAutor,
            l.idCategoria,
            a.nombre_completo AS autor_nombre, 
            c.nombre AS categoria_nombre 
        FROM libros l
        LEFT JOIN autores a ON l.idAutor = a.idAutor
        LEFT JOIN categorias c ON l.idCategoria = c.idCategoria
        ORDER BY l.idLibro DESC
    ");
    $stmt->execute();
    $libros = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($libros);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno: " . $e->getMessage()]);
}
?>
