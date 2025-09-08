// backend/models/compraModel.js
const { pool } = require('./db');

/**
 * Registra una nueva compra en la base de datos
 * @param {number} vuelo_id - ID del vuelo comprado
 * @param {string} correo_usuario - Email del usuario
 * @param {string} codigo_boleto - Código único del boleto generado
 * @returns {number|null} ID de la compra registrada o null si falla
 */
async function registrarCompra(vuelo_id, correo_usuario, codigo_boleto) {
  try {
    const [result] = await pool.query(
      `INSERT INTO compras (vuelo_id, correo_usuario, codigo_boleto, fecha_compra)
       VALUES (?, ?, ?, NOW())`,
      [vuelo_id, correo_usuario, codigo_boleto]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Compra registrada - ID: ${result.insertId}, Código: ${codigo_boleto}`);
      return result.insertId;
    }

    console.error('❌ No se pudo registrar la compra - Sin filas afectadas');
    return null;

  } catch (error) {
    console.error('❌ Error en registrarCompra:', error);
    
    // Verificar si es error de clave duplicada (código de boleto repetido)
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('❌ Código de boleto duplicado:', codigo_boleto);
      throw new Error('Código de boleto duplicado. Reintentar generación.');
    }
    
    // Verificar si es error de foreign key (vuelo no existe)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      console.error('❌ Vuelo no existe:', vuelo_id);
      throw new Error('El vuelo especificado no existe');
    }

    throw error;
  }
}

/**
 * Obtiene los detalles completos de una compra por código de boleto
 * @param {string} codigo_boleto - Código único del boleto
 * @returns {Object|null} Objeto con detalles de la compra y vuelo, o null si no existe
 */
async function obtenerCompraPorCodigo(codigo_boleto) {
  try {
    const [rows] = await pool.query(
      `SELECT 
         c.id,
         c.vuelo_id,
         c.correo_usuario,
         c.fecha_compra,
         c.codigo_boleto,
         v.origen,
         v.destino,
         v.fecha_salida,
         v.precio,
         v.asientos_disponibles
       FROM compras c
       INNER JOIN vuelos v ON c.vuelo_id = v.id
       WHERE c.codigo_boleto = ?`,
      [codigo_boleto]
    );

    if (rows.length > 0) {
      console.log(`✅ Compra encontrada - Código: ${codigo_boleto}`);
      return rows[0];
    }

    console.log(`ℹ️  No se encontró compra con código: ${codigo_boleto}`);
    return null;

  } catch (error) {
    console.error('❌ Error en obtenerCompraPorCodigo:', error);
    throw error;
  }
}

/**
 * Obtiene todas las compras realizadas por un email específico
 * @param {string} correo_usuario - Email del usuario
 * @returns {Array} Array de compras del usuario
 */
async function obtenerComprasPorEmail(correo_usuario) {
  try {
    const [rows] = await pool.query(
      `SELECT 
         c.id,
         c.vuelo_id,
         c.correo_usuario,
         c.fecha_compra,
         c.codigo_boleto,
         v.origen,
         v.destino,
         v.fecha_salida,
         v.precio
       FROM compras c
       INNER JOIN vuelos v ON c.vuelo_id = v.id
       WHERE c.correo_usuario = ?
       ORDER BY c.fecha_compra DESC`,
      [correo_usuario]
    );

    console.log(`✅ Encontradas ${rows.length} compras para email: ${correo_usuario}`);
    return rows;

  } catch (error) {
    console.error('❌ Error en obtenerComprasPorEmail:', error);
    throw error;
  }
}

/**
 * Verifica si un código de boleto ya existe en la base de datos
 * @param {string} codigo_boleto - Código a verificar
 * @returns {boolean} true si existe, false si no existe
 */
async function existeCodigoBoleto(codigo_boleto) {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM compras
       WHERE codigo_boleto = ?`,
      [codigo_boleto]
    );

    const existe = rows[0].total > 0;
    console.log(`🔍 Código ${codigo_boleto} ${existe ? 'YA EXISTE' : 'disponible'}`);
    return existe;

  } catch (error) {
    console.error('❌ Error en existeCodigoBoleto:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas básicas de compras
 * @returns {Object} Objeto con estadísticas de compras
 */
async function obtenerEstadisticasCompras() {
  try {
    const [rows] = await pool.query(
      `SELECT 
         COUNT(*) as total_compras,
         COUNT(DISTINCT correo_usuario) as usuarios_unicos,
         SUM(v.precio) as ingresos_totales,
         AVG(v.precio) as precio_promedio,
         MIN(c.fecha_compra) as primera_compra,
         MAX(c.fecha_compra) as ultima_compra
       FROM compras c
       INNER JOIN vuelos v ON c.vuelo_id = v.id`
    );

    if (rows.length > 0) {
      const estadisticas = {
        total_compras: parseInt(rows[0].total_compras),
        usuarios_unicos: parseInt(rows[0].usuarios_unicos),
        ingresos_totales: parseFloat(rows[0].ingresos_totales || 0),
        precio_promedio: parseFloat(rows[0].precio_promedio || 0),
        primera_compra: rows[0].primera_compra,
        ultima_compra: rows[0].ultima_compra
      };

      console.log('📊 Estadísticas de compras obtenidas exitosamente');
      return estadisticas;
    }

    return {
      total_compras: 0,
      usuarios_unicos: 0,
      ingresos_totales: 0,
      precio_promedio: 0,
      primera_compra: null,
      ultima_compra: null
    };

  } catch (error) {
    console.error('❌ Error en obtenerEstadisticasCompras:', error);
    throw error;
  }
}

/**
 * Elimina una compra (cancelación) - CUIDADO: También debe restaurar asientos
 * @param {string} codigo_boleto - Código del boleto a cancelar
 * @returns {boolean} true si se canceló correctamente
 */
async function cancelarCompra(codigo_boleto) {
  const connection = await pool.getConnection();
  
  try {
    // Iniciar transacción para asegurar consistencia
    await connection.beginTransaction();

    // 1. Obtener datos de la compra antes de eliminarla
    const [compraRows] = await connection.query(
      `SELECT vuelo_id FROM compras WHERE codigo_boleto = ?`,
      [codigo_boleto]
    );

    if (compraRows.length === 0) {
      await connection.rollback();
      console.log(`ℹ️  No se encontró compra para cancelar: ${codigo_boleto}`);
      return false;
    }

    const vuelo_id = compraRows[0].vuelo_id;

    // 2. Eliminar la compra
    const [deleteResult] = await connection.query(
      `DELETE FROM compras WHERE codigo_boleto = ?`,
      [codigo_boleto]
    );

    // 3. Restaurar el asiento disponible
    const [updateResult] = await connection.query(
      `UPDATE vuelos 
       SET asientos_disponibles = asientos_disponibles + 1 
       WHERE id = ?`,
      [vuelo_id]
    );

    // 4. Verificar que ambas operaciones fueron exitosas
    if (deleteResult.affectedRows > 0 && updateResult.affectedRows > 0) {
      await connection.commit();
      console.log(`✅ Compra cancelada y asiento restaurado: ${codigo_boleto}`);
      return true;
    } else {
      await connection.rollback();
      console.error(`❌ Error en cancelación: ${codigo_boleto}`);
      return false;
    }

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error en cancelarCompra:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  registrarCompra,
  obtenerCompraPorCodigo,
  obtenerComprasPorEmail,
  existeCodigoBoleto,
  obtenerEstadisticasCompras,
  cancelarCompra
};