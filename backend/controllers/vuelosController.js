// backend/controllers/vuelosController.js
const pool = require('../models/db');

// Buscar vuelos disponibles
async function buscarVuelos(req, res) {
  try {
    const { origen, destino, fecha } = req.query;

    // Validación básica
    if (!origen || !destino || !fecha) {
      return res.status(400).json({ error: "Debes indicar origen, destino y fecha" });
    }

    const [rows] = await pool.query(
      `SELECT id, origen, destino, fecha_salida, asientos_disponibles, precio
       FROM vuelos
       WHERE origen = ? AND destino = ? AND DATE(fecha_salida) = ? 
         AND asientos_disponibles > 0`,
      [origen, destino, fecha]
    );

    if (rows.length === 0) {
      return res.json({ mensaje: "No hay vuelos disponibles con esos parámetros" });
    }

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al buscar vuelos" });
  }
}

module.exports = { buscarVuelos };
