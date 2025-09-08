CREATE DATABASE IF NOT EXISTS sistema_vuelos;
USE sistema_vuelos;

CREATE TABLE vuelos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    fecha_salida DATETIME NOT NULL,
    asientos_disponibles INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL
);

CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vuelo_id INT NOT NULL,
    correo_usuario VARCHAR(150) NOT NULL,
    fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
    codigo_boleto VARCHAR(50) NOT NULL UNIQUE,
    FOREIGN KEY (vuelo_id) REFERENCES vuelos(id)
);

INSERT INTO vuelos (origen, destino, fecha_salida, asientos_disponibles, precio)
VALUES
-- 8 de septiembre
('Talca', 'Santiago', '2025-09-08 08:00:00', 50, 35000),
('Santiago', 'Concepcion', '2025-09-08 12:00:00', 45, 42000),
('Santiago', 'La Serena', '2025-09-08 18:00:00', 40, 46000),

-- 9 de septiembre
('Temuco', 'Santiago', '2025-09-09 07:30:00', 35, 39000),
('Santiago', 'Talca', '2025-09-09 13:15:00', 30, 36000),
('Santiago', 'Concepcion', '2025-09-09 19:45:00', 40, 42000),

-- 10 de septiembre
('Talca', 'Santiago', '2025-09-10 08:45:00', 48, 35000),
('Santiago', 'La Serena', '2025-09-10 14:00:00', 25, 47000),
('Temuco', 'Santiago', '2025-09-10 20:30:00', 32, 39500),

-- 11 de septiembre
('Santiago', 'Concepcion', '2025-09-11 09:00:00', 42, 42500),
('Talca', 'Santiago', '2025-09-11 15:15:00', 50, 35500),
('Santiago', 'La Serena', '2025-09-11 21:00:00', 22, 45500),

-- 12 de septiembre
('Temuco', 'Santiago', '2025-09-12 07:15:00', 30, 39000),
('Santiago', 'Talca', '2025-09-12 12:45:00', 28, 36000),
('Santiago', 'Concepcion', '2025-09-12 18:30:00', 41, 42000),

-- 13 de septiembre
('Talca', 'Santiago', '2025-09-13 09:30:00', 47, 35000),
('Santiago', 'La Serena', '2025-09-13 16:00:00', 20, 46000),
('Temuco', 'Santiago', '2025-09-13 22:15:00', 33, 39500),

-- 14 de septiembre
('Santiago', 'Concepcion', '2025-09-14 08:00:00', 43, 42000),
('Talca', 'Santiago', '2025-09-14 14:30:00', 50, 35000),
('Santiago', 'La Serena', '2025-09-14 19:15:00', 21, 45500),

-- 15 de septiembre (tus vuelos + variaciones extra)
('Talca', 'Santiago', '2025-09-15 08:00:00', 50, 35000),
('Santiago', 'Concepcion', '2025-09-15 13:00:00', 39, 42000),
('Santiago', 'La Serena', '2025-09-15 18:30:00', 20, 45000),

-- 16 de septiembre
('Santiago', 'Concepcion', '2025-09-16 10:30:00', 40, 42000),
('Talca', 'Santiago', '2025-09-16 15:00:00', 49, 35500),
('Temuco', 'Santiago', '2025-09-16 20:45:00', 31, 39500),

-- 17 de septiembre
('Temuco', 'Santiago', '2025-09-17 14:15:00', 30, 39000),
('Santiago', 'La Serena', '2025-09-17 09:00:00', 24, 46000),
('Santiago', 'Concepcion', '2025-09-17 19:30:00', 42, 42500),

-- 18 de septiembre
('Santiago', 'La Serena', '2025-09-18 09:45:00', 20, 45000),
('Talca', 'Santiago', '2025-09-18 15:30:00', 47, 35000),
('Santiago', 'Concepcion', '2025-09-18 21:15:00', 38, 42000),

-- 19 de septiembre
('Temuco', 'Santiago', '2025-09-19 08:30:00', 34, 39000),
('Santiago', 'Talca', '2025-09-19 13:00:00', 30, 36000),
('Santiago', 'La Serena', '2025-09-19 19:45:00', 23, 46500),

-- 20 de septiembre
('Talca', 'Santiago', '2025-09-20 07:45:00', 50, 35000),
('Santiago', 'Concepcion', '2025-09-20 14:15:00', 40, 42000),
('Temuco', 'Santiago', '2025-09-20 20:30:00', 33, 39500),
-- 21 de septiembre
('Talca', 'Santiago', '2025-09-21 08:00:00', 50, 35000),
('Santiago', 'Concepcion', '2025-09-21 14:00:00', 40, 42000),
('Santiago', 'La Serena', '2025-09-21 20:15:00', 22, 45500),

-- 22 de septiembre
('Temuco', 'Santiago', '2025-09-22 07:30:00', 32, 39000),
('Santiago', 'Talca', '2025-09-22 13:15:00', 28, 36000),
('Santiago', 'Concepcion', '2025-09-22 18:45:00', 39, 42000),

-- 23 de septiembre
('Talca', 'Santiago', '2025-09-23 09:00:00', 48, 35000),
('Santiago', 'La Serena', '2025-09-23 15:30:00', 25, 47000),
('Temuco', 'Santiago', '2025-09-23 21:45:00', 30, 39500),

-- 24 de septiembre
('Santiago', 'Concepcion', '2025-09-24 08:15:00', 41, 42000),
('Talca', 'Santiago', '2025-09-24 14:30:00', 50, 35500),
('Santiago', 'La Serena', '2025-09-24 19:00:00', 21, 46000),

-- 25 de septiembre
('Temuco', 'Santiago', '2025-09-25 07:45:00', 34, 39000),
('Santiago', 'Talca', '2025-09-25 12:45:00', 30, 36000),
('Santiago', 'Concepcion', '2025-09-25 18:30:00', 42, 42500),

-- 26 de septiembre
('Talca', 'Santiago', '2025-09-26 08:30:00', 47, 35000),
('Santiago', 'La Serena', '2025-09-26 14:45:00', 23, 46500),
('Temuco', 'Santiago', '2025-09-26 20:15:00', 33, 39500),

-- 27 de septiembre
('Santiago', 'Concepcion', '2025-09-27 09:00:00', 40, 42000),
('Talca', 'Santiago', '2025-09-27 15:30:00', 50, 35000),
('Santiago', 'La Serena', '2025-09-27 21:00:00', 20, 45500),

-- 28 de septiembre
('Temuco', 'Santiago', '2025-09-28 07:00:00', 31, 39000),
('Santiago', 'Talca', '2025-09-28 13:30:00', 30, 36000),
('Santiago', 'Concepcion', '2025-09-28 19:15:00', 38, 42000),

-- 29 de septiembre
('Talca', 'Santiago', '2025-09-29 08:45:00', 50, 35000),
('Santiago', 'La Serena', '2025-09-29 14:00:00', 24, 47000),
('Temuco', 'Santiago', '2025-09-29 20:30:00', 32, 39500),

-- 30 de septiembre
('Santiago', 'Concepcion', '2025-09-30 09:30:00', 41, 42500),
('Talca', 'Santiago', '2025-09-30 15:00:00', 50, 35500),
('Santiago', 'La Serena', '2025-09-30 21:15:00', 22, 46000);
