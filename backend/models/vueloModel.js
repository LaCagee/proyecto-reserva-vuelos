// backend/models/vueloModel.js
const { pool } = require('./db');

/**
 * Busca vuelos disponibles según criterios específicos
 * @param {string} origen - Ciudad de origen
 * @param {string} destino - Ciudad de destino  
 * @param {string} fecha - Fecha de salida (YYYY-MM-DD)
 * @returns {Array} Array de vuelos disponibles
 */
async function obtenerVuelosPorCriterios(origen, destino, fecha) {
  try {
    const [rows] = await pool.query(
      `SELECT id, origen, destino, fecha_salida, asientos_disponibles, precio
       FROM vuelos
       WHERE origen = ? AND destino = ? AND DATE(fecha_salida) = ? 
         AND asientos_disponibles > 0
       ORDER BY fecha_salida ASC`,
      [origen, destino, fecha]
    );
    return rows;
  } catch (error) {
    console.error('Error en obtenerVuelosPorCriterios:', error);
    throw error;
  }
}

/**
 * Obtiene un vuelo específico por ID
 * @param {number} id - ID del vuelo
 * @returns {Object|null} Objeto del vuelo o null si no existe
 */
async function obtenerVueloPorId(id) {
  try {
    const [rows] = await pool.query(
      `SELECT id, origen, destino, fecha_salida, asientos_disponibles, precio
       FROM vuelos
       WHERE id = ? AND asientos_disponibles > 0`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error en obtenerVueloPorId:', error);
    throw error;
  }
}

/**
 * Actualiza los asientos disponibles de un vuelo
 * @param {number} id - ID del vuelo
 * @param {number} nuevosAsientos - Cantidad de asientos después de la reserva
 * @returns {boolean} true si se actualizó correctamente
 */
async function actualizarAsientosDisponibles(id, nuevosAsientos) {
  try {
    const [result] = await pool.query(
      `UPDATE vuelos 
       SET asientos_disponibles = ? 
       WHERE id = ?`,
      [nuevosAsientos, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error en actualizarAsientosDisponibles:', error);
    throw error;
  }
}

module.exports = {
  obtenerVuelosPorCriterios,
  obtenerVueloPorId,
  actualizarAsientosDisponibles
};