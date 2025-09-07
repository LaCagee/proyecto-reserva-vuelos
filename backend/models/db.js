const mysql = require('mysql2/promise');

// conexión a la base de datos
const pool = mysql.createPool({
  host: 'localhost',       
  user: 'root',            
  password: 'xcasdqwe1', 
  database: 'sistema_vuelos', 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
  }
};
// aqui exportamos el pool de conexiones
module.exports = {
  pool,
  testConnection
};
