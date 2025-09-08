// backend/controllers/vuelosController.js
const { obtenerVuelosPorCriterios, obtenerVueloPorId } = require('../models/vueloModel');

/**
 * Buscar vuelos disponibles según origen, destino y fecha
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function buscarVuelos(req, res) {
  try {
    const { origen, destino, fecha } = req.query;

    // Validación de parámetros requeridos
    if (!origen || !destino || !fecha) {
      return res.status(400).json({ 
        error: "Debes indicar origen, destino y fecha",
        ejemplo: "?origen=Santiago&destino=Concepción&fecha=2025-09-16"
      });
    }

    // Validación de formato de fecha (básica)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({ 
        error: "Formato de fecha inválido. Usa YYYY-MM-DD",
        ejemplo: "2025-09-16"
      });
    }

    // Buscar vuelos en la base de datos
    const vuelos = await obtenerVuelosPorCriterios(origen, destino, fecha);

    // Verificar si se encontraron vuelos
    if (vuelos.length === 0) {
      return res.status(404).json({ 
        mensaje: "No hay vuelos disponibles con esos parámetros",
        criterios: { origen, destino, fecha }
      });
    }

    // Formatear respuesta para el frontend
    const vuelosFormateados = vuelos.map(vuelo => ({
      id: vuelo.id,
      origen: vuelo.origen,
      destino: vuelo.destino,
      fecha_salida: vuelo.fecha_salida,
      asientos_disponibles: vuelo.asientos_disponibles,
      precio: parseFloat(vuelo.precio),
      precio_formateado: `$${parseFloat(vuelo.precio).toLocaleString('es-CL')}`
    }));

    res.json({
      total: vuelosFormateados.length,
      vuelos: vuelosFormateados
    });

  } catch (error) {
    console.error('Error en buscarVuelos:', error);
    res.status(500).json({ 
      error: "Error interno del servidor al buscar vuelos",
      mensaje: "Inténtalo nuevamente en unos momentos"
    });
  }
}

/**
 * Obtener detalles de un vuelo específico
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function obtenerDetalleVuelo(req, res) {
  try {
    const { id } = req.params;

    // Validar que el ID sea un número
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        error: "ID de vuelo inválido"
      });
    }

    const vuelo = await obtenerVueloPorId(parseInt(id));

    if (!vuelo) {
      return res.status(404).json({ 
        error: "Vuelo no encontrado o sin asientos disponibles"
      });
    }

    // Formatear respuesta
    const vueloFormateado = {
      id: vuelo.id,
      origen: vuelo.origen,
      destino: vuelo.destino,
      fecha_salida: vuelo.fecha_salida,
      asientos_disponibles: vuelo.asientos_disponibles,
      precio: parseFloat(vuelo.precio),
      precio_formateado: `$${parseFloat(vuelo.precio).toLocaleString('es-CL')}`
    };

    res.json(vueloFormateado);

  } catch (error) {
    console.error('Error en obtenerDetalleVuelo:', error);
    res.status(500).json({ 
      error: "Error interno del servidor al obtener vuelo"
    });
  }
}

module.exports = { 
  buscarVuelos,
  obtenerDetalleVuelo 
};