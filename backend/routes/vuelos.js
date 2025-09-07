const express = require('express');
const { buscarVuelos } = require('../controllers/vuelosController');

const router = express.Router();

// GET /vuelos?origen=Santiago&destino=Concepción&fecha=2025-09-16
router.get('/', buscarVuelos);

module.exports = router;
