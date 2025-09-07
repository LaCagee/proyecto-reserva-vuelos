// backend/server.js
const express = require('express');
const {pool, testConnection } = require('./models/db');

const app = express();
app.use(express.json());

// Ruta de prueba para verificar conexión
app.get('/ping', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    res.json({ conexion: 'ok', resultado: rows[0].resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }
});



















// Servidor en puerto 3000
app.listen(3000, () => {
    testConnection();
  console.log('Servidor corriendo en http://localhost:3000');
});
