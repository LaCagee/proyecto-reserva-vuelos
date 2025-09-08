// backend/routes/vuelos.js
const express = require('express');
const { buscarVuelos, obtenerDetalleVuelo } = require('../controllers/vuelosController');

const router = express.Router();

/**
 * @route   GET /api/vuelos/buscar
 * @desc    Buscar vuelos disponibles por origen, destino y fecha
 * @access  Público
 * @query   {string} origen - Ciudad de origen
 * @query   {string} destino - Ciudad de destino
 * @query   {string} fecha - Fecha en formato YYYY-MM-DD
 * @example GET /api/vuelos/buscar?origen=Santiago&destino=Concepción&fecha=2025-09-16
 */
router.get('/buscar', buscarVuelos);

/**
 * @route   GET /api/vuelos/:id
 * @desc    Obtener detalles específicos de un vuelo por ID
 * @access  Público
 * @param   {number} id - ID del vuelo
 * @example GET /api/vuelos/123
 */
router.get('/:id', obtenerDetalleVuelo);

/**
 * @route   GET /api/vuelos
 * @desc    Endpoint informativo sobre cómo usar la API de vuelos
 * @access  Público
 */
router.get('/', (req, res) => {
  res.json({
    message: 'API de Vuelos - Sistema de Reservas',
    endpoints: [
      {
        method: 'GET',
        path: '/api/vuelos/buscar',
        description: 'Buscar vuelos disponibles',
        parameters: {
          origen: 'Ciudad de origen (requerido)',
          destino: 'Ciudad de destino (requerido)',
          fecha: 'Fecha de salida YYYY-MM-DD (requerido)'
        },
        example: '/api/vuelos/buscar?origen=Santiago&destino=Concepción&fecha=2025-09-16'
      },
      {
        method: 'GET',
        path: '/api/vuelos/:id',
        description: 'Obtener detalles de un vuelo específico',
        parameters: {
          id: 'ID numérico del vuelo (requerido)'
        },
        example: '/api/vuelos/1'
      }
    ],
    version: '1.0.0'
  });
});

module.exports = router;