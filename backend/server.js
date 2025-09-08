// backend/server.js
const express = require('express');
const path = require('path');
const { testConnection } = require('./models/db');

// Importar rutas
const vuelosRoutes = require('./routes/vuelos');
const comprasRoutes = require('./routes/compras');

/**
 * Inicializa y configura el servidor Express
 * @returns {Object} Aplicación Express configurada
 */
function createApp() {
  const app = express();

  // Middleware básico
  app.use(express.json()); 
  app.use(express.urlencoded({ extended: true })); 

  // Middleware para CORS (permitir peticiones desde el frontend)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Responder a preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  // Servir archivos estáticos del frontend
  app.use(express.static(path.join(__dirname, '../frontend')));

  // Middleware de logging para desarrollo
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });

  // Rutas de la API
  app.use('/api/vuelos', vuelosRoutes);
  app.use('/api/compras', comprasRoutes);

  // Ruta raíz - servir index.html
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  // Rutas para las páginas del frontend
  app.get('/resultados', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/resultados.html'));
  });

  app.get('/compra', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/compra.html'));
  });

  // Ruta de health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Sistema de Reservas de Vuelos'
    });
  });

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    message: 'La ruta solicitada no existe en este servidor'
  });
});



  // Middleware global de manejo de errores
  app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    
    res.status(error.status || 500).json({
      error: 'Error interno del servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

/**
 * Inicia el servidor en el puerto especificado
 * @param {number} port - Puerto en el que ejecutar el servidor
 */
async function startServer(port = 3000) {
  try {
    // Probar conexión a la base de datos antes de iniciar
    console.log('🔄 Probando conexión a la base de datos...');
    await testConnection();

    // Crear y configurar la aplicación
    const app = createApp();

    // Iniciar el servidor
    const server = app.listen(port, () => {
      console.log('🚀 ====================================');
      console.log(`🚀 Servidor iniciado exitosamente`);
      console.log(`🚀 Puerto: ${port}`);
      console.log(`🚀 URL local: http://localhost:${port}`);
      console.log(`🚀 API: http://localhost:${port}/api`);
      console.log(`🚀 Health check: http://localhost:${port}/health`);
      console.log('🚀 ====================================');
    });

    // Manejo de cierre graceful del servidor
    process.on('SIGTERM', () => {
      console.log('🛑 Recibida señal SIGTERM. Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Recibida señal SIGINT (Ctrl+C). Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    return server;

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    console.error('💡 Verifica que MySQL esté ejecutándose y la configuración sea correcta');
    process.exit(1);
  }
}

// Solo ejecutar si este archivo es llamado directamente
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  startServer(PORT);
}

module.exports = { createApp, startServer };