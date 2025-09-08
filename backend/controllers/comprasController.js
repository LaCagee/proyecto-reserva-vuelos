// backend/controllers/comprasController.js
const { obtenerVueloPorId, actualizarAsientosDisponibles } = require('../models/vueloModel');
const { registrarCompra, obtenerCompraPorCodigo } = require('../models/compraModel');
const { enviarBoletoEmail } = require('../services/emailService');

/**
 * Procesa la compra de un boleto de vuelo
 * @param {Object} req - Request object con vuelo_id y correo_usuario
 * @param {Object} res - Response object
 */
async function procesarCompra(req, res) {
  try {
    const { vuelo_id, correo_usuario } = req.body;

    console.log(`🎫 Iniciando compra - Vuelo: ${vuelo_id}, Email: ${correo_usuario}`);

    // 1. Verificar que el vuelo existe y tiene asientos disponibles
    const vuelo = await obtenerVueloPorId(vuelo_id);
    
    if (!vuelo) {
      return res.status(404).json({
        error: 'Vuelo no encontrado',
        detalle: 'El vuelo no existe o no tiene asientos disponibles'
      });
    }

    if (vuelo.asientos_disponibles <= 0) {
      return res.status(400).json({
        error: 'Sin asientos disponibles',
        detalle: 'Este vuelo ya no tiene asientos disponibles'
      });
    }

    // 2. Generar código único del boleto
    const codigoBoleto = generarCodigoBoleto();
    console.log(`📝 Código de boleto generado: ${codigoBoleto}`);

    // 3. Registrar la compra en la base de datos
    const compraId = await registrarCompra(vuelo_id, correo_usuario, codigoBoleto);
    
    if (!compraId) {
      throw new Error('Error al registrar la compra en la base de datos');
    }

    // 4. Actualizar asientos disponibles (reducir en 1)
    const nuevosAsientos = vuelo.asientos_disponibles - 1;
    const asientosActualizados = await actualizarAsientosDisponibles(vuelo_id, nuevosAsientos);
    
    if (!asientosActualizados) {
      // Si falla la actualización, habría que hacer rollback de la compra
      console.error('❌ Error actualizando asientos disponibles');
      throw new Error('Error actualizando disponibilidad de asientos');
    }

    // 5. Preparar datos del boleto para el email
    const datosboleto = {
      codigo: codigoBoleto,
      vuelo: {
        id: vuelo.id,
        origen: vuelo.origen,
        destino: vuelo.destino,
        fecha_salida: vuelo.fecha_salida,
        precio: vuelo.precio
      },
      usuario: {
        email: correo_usuario
      },
      fecha_compra: new Date()
    };

    // 6. Enviar boleto por email
    try {
      await enviarBoletoEmail(datosboleto);
      console.log(`✅ Boleto enviado exitosamente a: ${correo_usuario}`);
    } catch (emailError) {
      console.error('⚠️  Error enviando email:', emailError.message);
      // No fallar la compra si el email falla, pero informar al usuario
    }

    // 7. Respuesta exitosa
    res.status(201).json({
      mensaje: 'Compra procesada exitosamente',
      compra: {
        id: compraId,
        codigo_boleto: codigoBoleto,
        vuelo: {
          origen: vuelo.origen,
          destino: vuelo.destino,
          fecha_salida: vuelo.fecha_salida,
          precio: parseFloat(vuelo.precio)
        },
        correo_usuario: correo_usuario,
        fecha_compra: new Date().toISOString(),
        asientos_restantes: nuevosAsientos
      },
      instrucciones: [
        'Tu boleto ha sido enviado a tu correo electrónico',
        'Guarda el código de boleto para futuras consultas',
        'Presenta tu boleto digital al momento del vuelo'
      ]
    });

    console.log(`🎉 Compra completada exitosamente - ID: ${compraId}`);

  } catch (error) {
    console.error('❌ Error en procesarCompra:', error);
    
    res.status(500).json({
      error: 'Error interno procesando la compra',
      mensaje: 'No se pudo completar la transacción. Inténtalo nuevamente.',
      codigo_error: error.message.includes('database') ? 'DB_ERROR' : 'GENERAL_ERROR'
    });
  }
}

/**
 * Consulta los detalles de una compra por código de boleto
 * @param {Object} req - Request object con el código en params
 * @param {Object} res - Response object
 */
async function consultarCompra(req, res) {
  try {
    const { codigo } = req.params;

    // Validar formato del código
    if (!codigo || codigo.length < 10) {
      return res.status(400).json({
        error: 'Código de boleto inválido',
        formato_esperado: 'BOL-2025-XXXXXX'
      });
    }

    console.log(`🔍 Consultando compra con código: ${codigo}`);

    // Buscar la compra en la base de datos
    const compra = await obtenerCompraPorCodigo(codigo);

    if (!compra) {
      return res.status(404).json({
        error: 'Boleto no encontrado',
        detalle: 'No existe ninguna compra con ese código de boleto'
      });
    }

    // Formatear respuesta
    const compraFormateada = {
      codigo_boleto: compra.codigo_boleto,
      estado: 'Confirmado',
      vuelo: {
        id: compra.vuelo_id,
        origen: compra.origen,
        destino: compra.destino,
        fecha_salida: compra.fecha_salida,
        precio: parseFloat(compra.precio)
      },
      compra: {
        correo_usuario: compra.correo_usuario,
        fecha_compra: compra.fecha_compra
      },
      instrucciones: [
        'Presenta este boleto digital al momento del vuelo',
        'Llega al aeropuerto 1 hora antes del vuelo',
        'Porta un documento de identidad válido'
      ]
    };

    res.json(compraFormateada);
    console.log(`✅ Consulta de compra exitosa: ${codigo}`);

  } catch (error) {
    console.error('❌ Error en consultarCompra:', error);
    
    res.status(500).json({
      error: 'Error interno consultando la compra',
      mensaje: 'No se pudo consultar el boleto. Inténtalo nuevamente.'
    });
  }
}

/**
 * Genera un código único para el boleto
 * @returns {string} Código único en formato BOL-YYYY-XXXXXX
 */
function generarCodigoBoleto() {
  const año = new Date().getFullYear();
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  
  // Generar 6 caracteres aleatorios
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  
  return `BOL-${año}-${codigo}`;
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
function validarEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  procesarCompra,
  consultarCompra,
  generarCodigoBoleto,
  validarEmail
};