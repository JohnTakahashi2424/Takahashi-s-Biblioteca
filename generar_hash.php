<?php
// generar_hash.php - Creador de Hash de Rescate BCRYPT
// Modo de uso: Solo debes ejecutar este archivo en el navegador
// Ejemplo: http://localhost/Takahashi-s-Biblioteca/generar_hash.php

// La contraseña que deseas encriptar
$password_plano = "password"; 

// Asegurarse de forzar el algoritmo BCRYPT
$hash_generado = password_hash($password_plano, PASSWORD_BCRYPT);

echo "<div style='font-family: sans-serif; padding: 20px;'>";
echo "<h2>Generador de Rescate Bcrypt</h2>";
echo "<p>Contraseña original: <b>" . htmlspecialchars($password_plano) . "</b></p>";
echo "<p>Tu Hash Seguro es:</p>";
echo "<textarea style='width:100%; height:50px; font-size:16px;' readonly>$hash_generado</textarea>";
echo "<p style='color:#555;'><i>Copia este texto largo y pégalo directamente en la columna 'password' de tu usuario en phpMyAdmin. Asegúrate de borrar cualquier espacio en blanco al inicio o al final.</i></p>";
echo "</div>";
?>
