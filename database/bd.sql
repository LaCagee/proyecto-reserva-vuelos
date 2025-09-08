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
('Talca', 'Santiago', '2025-09-15 08:00:00', 50, 35000),
('Santiago', 'Concepcion', '2025-09-16 10:30:00', 40, 42000),
('Temuco', 'Santiago', '2025-09-17 14:15:00', 30, 39000),
('Santiago', 'La Serena', '2025-09-18 09:45:00', 20, 45000);
