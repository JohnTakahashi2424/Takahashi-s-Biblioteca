<?php
require_once 'config.php';

try {
    $stmt = $pdo->prepare("SELECT idCategoria, nombre FROM categorias ORDER BY nombre ASC");
    $stmt->execute();
    $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($categorias);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno: " . $e->getMessage()]);
}
?>
