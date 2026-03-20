-- Seeder para la tabla usuarios del Sistema Bibliotecario B2B2C
-- Regla Institucional: Un único Administrador Global, y los lectores solo son inyectados vía panel por el Admin.

CREATE TABLE IF NOT EXISTS `usuarios` (
  `idUsuario` int(11) NOT NULL AUTO_INCREMENT,
  `documento` varchar(50) NOT NULL UNIQUE COMMENT 'Carnet o código de estudiante / usuario admin',
  `nombre` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','lector') NOT NULL DEFAULT 'lector',
  `telefono` varchar(50) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`idUsuario`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar de manera única al Administrador Máster Global
-- Credenciales por defecto: admin@biblioteca.com / AdminMaster123!
-- La contraseña está hasheada con BCRYPT cost 10.
INSERT INTO `usuarios` (`documento`, `nombre`, `email`, `password`, `rol`, `telefono`) 
VALUES (
    'ADMIN-MASTER', 
    'Administración Central', 
    'admin@biblioteca.com', 
    '$2y$10$wIfB1B9.R52U9h6k02G7w.uC9mG2U78rA08uYh5hE0V78mE5XyX2q', /* Hash BCRYPT de "AdminMaster123!" */
    'admin', 
    '000-0000'
) ON DUPLICATE KEY UPDATE `nombre` = `nombre`;
