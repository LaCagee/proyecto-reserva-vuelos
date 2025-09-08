// backend/routes/compras.js
const express = require('express');
const { procesarCompra, consultarCompra } = require('../controllers/comprasController');

const router = express.Router();

/**
 * @route   POST /api/compras
 * @desc    Procesar compra de un boleto de vuelo
 * @access  Público
 * @body    {number} vuelo_id - ID del vuelo a comprar
 * @body    {string} correo_usuario - Email donde enviar el boleto
 * @example POST /api/compras
 *          Body: { "vuelo_id": 1, "correo_usuario": "usuario@email.com" }
 */
router.post('/', procesarCompra);

/**
 * @route   GET /api/compras/:codigo
 * @desc    Consultar detalles de una compra por código de boleto
 * @access  Público
 * @param   {string} codigo - Código único del boleto
 * @example GET /api/compras/BOL-2025-ABC123
 */
router.get('/:codigo', consultarCompra);

/**
 * @route   GET /api/compras
 * @desc    Endpoint informativo sobre cómo usar la API de compras
 * @access  Público
 */
router.get('/', (req, res) => {
  res.json({
    message: 'API de Compras - Sistema de Reservas',
    endpoints: [
      {
        method: 'POST',
        path: '/api/compras',
        description: 'Procesar compra de boleto',
        body: {
          vuelo_id: 'ID numérico del vuelo (requerido)',
          correo_usuario: 'Email del usuario (requerido)'
        },
        example: {
          vuelo_id: 1,
          correo_usuario: 'usuario@email.com'
        }
      },
      {
        method: 'GET',
        path: '/api/compras/:codigo',
        description: 'Consultar compra por código de boleto',
        parameters: {
          codigo: 'Código único del boleto (requerido)'
        },
        example: '/api/compras/BOL-2025-ABC123'
      }
    ],
    version: '1.0.0'
  });
});

/**
 * Middleware para validar datos de compra
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function validarDatosCompra(req, res, next) {
  const { vuelo_id, correo_usuario } = req.body;

  // Validar que los campos requeridos estén presentes
  if (!vuelo_id || !correo_usuario) {
    return res.status(400).json({
      error: 'Datos incompletos',
      requeridos: ['vuelo_id', 'correo_usuario'],
      recibido: req.body
    });
  }

  // Validar formato de email básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo_usuario)) {
    return res.status(400).json({
      error: 'Formato de correo electrónico inválido',
      ejemplo: 'usuario@email.com'
    });
  }

  // Validar que vuelo_id sea un número
  if (isNaN(vuelo_id) || vuelo_id <= 0) {
    return res.status(400).json({
      error: 'ID de vuelo inválido',
      detalle: 'Debe ser un número positivo'
    });
  }

  next();
}

// Aplicar middleware de validación solo a la ruta POST
router.post('/', validarDatosCompra, procesarCompra);

module.exports = router;