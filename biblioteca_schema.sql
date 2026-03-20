-- ==========================================================
-- SCRIPT DE BASE DE DATOS: BIBLIOTECA DIGITAL B2B2C
-- ==========================================================
CREATE DATABASE IF NOT EXISTS biblioteca_takahashi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biblioteca_takahashi;

-- 1. TABLA: usuarios (Administradores y Lectores)
-- NOTA: Esta tabla ya existe en tu DB, está aquí solo como referencia
CREATE TABLE IF NOT EXISTS `usuarios` (
  `idUsuario` INT AUTO_INCREMENT PRIMARY KEY,
  `documento` VARCHAR(20) UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `rol` ENUM('admin', 'lector') NOT NULL DEFAULT 'lector',
  `telefono` VARCHAR(50) NULL,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA: categorias (NUEVA)
CREATE TABLE `categorias` (
  `idCategoria` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA: autores (NUEVA)
CREATE TABLE `autores` (
  `idAutor` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_completo` VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA: libros (NUEVA)
CREATE TABLE `libros` (
  `idLibro` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(200) NOT NULL,
  `idAutor` INT NOT NULL,
  `idCategoria` INT NOT NULL,
  `isbn` VARCHAR(50) NULL,
  `anio_publicacion` INT,
  `estado` ENUM('disponible', 'prestado') DEFAULT 'disponible',
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`idAutor`) REFERENCES `autores`(`idAutor`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`idCategoria`) REFERENCES `categorias`(`idCategoria`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA: prestamos (NUEVA)
CREATE TABLE `prestamos` (
  `idPrestamo` INT AUTO_INCREMENT PRIMARY KEY,
  `idUsuario` INT NOT NULL,
  `idLibro` INT NOT NULL,
  `fecha_prestamo` DATE NOT NULL,
  `fecha_vencimiento` DATE NOT NULL,
  `estado` ENUM('activo', 'devuelto', 'vencido') DEFAULT 'activo',
  FOREIGN KEY (`idUsuario`) REFERENCES `usuarios`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`idLibro`) REFERENCES `libros`(`idLibro`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
