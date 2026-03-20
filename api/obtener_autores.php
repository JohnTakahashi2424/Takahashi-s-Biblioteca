<?php
require_once 'config.php';

try {
    $stmt = $pdo->prepare("SELECT idAutor, nombre_completo FROM autores ORDER BY nombre_completo ASC");
    $stmt->execute();
    $autores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($autores);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno: " . $e->getMessage()]);
}
?>
