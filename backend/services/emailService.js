// backend/services/emailService.js
const nodemailer = require('nodemailer');

/**
 * Configuración del transportador de email
 */
const transporter = nodemailer.createTransport({
  // Configuración para Gmail (puedes cambiar por otro proveedor)
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '', 
    pass: process.env.EMAIL_PASS || ''     
  }
});
/**
 * Verifica la configuración del transportador de email
 * @returns {Promise<boolean>} true si la configuración es válida
 */
async function verificarConfiguracionEmail() {
  try {
    await transporter.verify();
    console.log('✅ Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en configuración de email:', error.message);
    console.error('💡 Verifica las credenciales de email en las variables de entorno');
    return false;
  }
}

/**
 * Envía el boleto de vuelo por correo electrónico
 * @param {Object} datosBoleto - Datos del boleto y vuelo
 * @param {string} datosBoleto.codigo - Código único del boleto
 * @param {Object} datosBoleto.vuelo - Información del vuelo
 * @param {Object} datosBoleto.usuario - Información del usuario
 * @param {Date} datosBoleto.fecha_compra - Fecha de la compra
 * @returns {Promise<boolean>} true si el email se envió correctamente
 */
async function enviarBoletoEmail(datosBoleto) {
  try {
    const { codigo, vuelo, usuario, fecha_compra } = datosBoleto;

    // Formatear fecha de salida para mostrar mejor
    const fechaSalidaFormateada = new Date(vuelo.fecha_salida).toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
    });

    // Formatear fecha de compra
    const fechaCompraFormateada = new Date(fecha_compra).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
    });

    // Formatear precio
    const precioFormateado = `$${parseFloat(vuelo.precio).toLocaleString('es-CL')}`;

    // Crear el contenido HTML del email
    const htmlContent = generarHTMLBoleto({
      codigo,
      vuelo: {
        ...vuelo,
        fecha_salida_formateada: fechaSalidaFormateada,
        precio_formateado: precioFormateado
      },
      usuario,
      fecha_compra_formateada: fechaCompraFormateada
    });

    // Crear el contenido de texto plano como alternativa
    const textContent = generarTextoBoleto({
      codigo,
      vuelo,
      usuario,
      fecha_compra,
      fechaSalidaFormateada,
      precioFormateado,
      fechaCompraFormateada
    });

    // Configurar el mensaje
    const mailOptions = {
      from: {
        name: 'Sistema de Reservas - Aerolínea Regional',
        address: process.env.EMAIL_USER || 'sistema@aerolinea.com'
      },
      to: usuario.email,
      subject: `🎫 Tu Boleto de Vuelo - ${codigo}`,
      text: textContent,
      html: htmlContent      
    };

    console.log(`📧 Enviando boleto a: ${usuario.email}`);

    // Enviar el email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email enviado exitosamente');
    console.log(`📬 Message ID: ${info.messageId}`);
    
    // En desarrollo, mostrar URL de vista previa (solo con algunos proveedores)
    if (process.env.NODE_ENV === 'development' && info.preview) {
      console.log(`👀 Vista previa: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    
    // Clasificar tipos de error para mejor debugging
    if (error.code === 'EAUTH') {
      console.error('💡 Error de autenticación - Verifica credenciales de email');
    } else if (error.code === 'ECONNECTION') {
      console.error('💡 Error de conexión - Verifica configuración SMTP');
    } else if (error.responseCode === 550) {
      console.error('💡 Dirección de email inválida o rechazada');
    }

    throw error;
  }
}

/**
 * Genera el contenido HTML para el boleto
 * @param {Object} datos - Datos formateados del boleto
 * @returns {string} Contenido HTML del email
 */
function generarHTMLBoleto(datos) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tu Boleto de Vuelo</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .boleto { border: 2px dashed #667eea; padding: 20px; margin: 20px 0; background: #f9f9ff; border-radius: 10px; }
            .codigo { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; margin-bottom: 20px; letter-spacing: 2px; }
            .vuelo-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
            .info-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 16px; font-weight: bold; color: #333; }
            .precio { font-size: 24px; color: #28a745; text-align: center; margin: 20px 0; }
            .instrucciones { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            @media (max-width: 600px) { .vuelo-info { grid-template-columns: 1fr; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✈️ Tu Boleto de Vuelo</h1>
                <p>¡Reserva confirmada exitosamente!</p>
            </div>
            
            <div class="content">
                <div class="boleto">
                    <div class="codigo">${datos.codigo}</div>
                    
                    <div class="vuelo-info">
                        <div class="info-item">
                            <div class="info-label">Origen</div>
                            <div class="info-value">${datos.vuelo.origen}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Destino</div>
                            <div class="info-value">${datos.vuelo.destino}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Fecha y Hora de Salida</div>
                            <div class="info-value">${datos.vuelo.fecha_salida_formateada}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Precio</div>
                            <div class="info-value">${datos.vuelo.precio_formateado}</div>
                        </div>
                    </div>
                </div>
                
                <div class="instrucciones">
                    <h3>📋 Instrucciones Importantes:</h3>
                    <ul>
                        <li>Presenta este boleto digital al momento del vuelo</li>
                        <li>Llega al aeropuerto <strong>1 hora antes</strong> del vuelo</li>
                        <li>Porta un <strong>documento de identidad válido</strong></li>
                        <li>Guarda este código: <strong>${datos.codigo}</strong> para futuras consultas</li>
                    </ul>
                </div>
                
                <p><strong>Fecha de compra:</strong> ${datos.fecha_compra_formateada}</p>
                <p><strong>Email:</strong> ${datos.usuario.email}</p>
            </div>
            
            <div class="footer">
                <p>Gracias por volar con nosotros | Sistema de Reservas - Aerolínea Regional</p>
                <p>Este es un email automático, no responder directamente</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Genera el contenido de texto plano para el boleto
 * @param {Object} datos - Datos del boleto
 * @returns {string} Contenido de texto plano
 */
function generarTextoBoleto(datos) {
  return `
🎫 TU BOLETO DE VUELO
=====================

Código de Boleto: ${datos.codigo}

DETALLES DEL VUELO:
------------------
Origen: ${datos.vuelo.origen}
Destino: ${datos.vuelo.destino}
Fecha de Salida: ${datos.fechaSalidaFormateada}
Precio: ${datos.precioFormateado}

INFORMACIÓN DE COMPRA:
---------------------
Email: ${datos.usuario.email}
Fecha de Compra: ${datos.fechaCompraFormateada}

INSTRUCCIONES IMPORTANTES:
-------------------------
• Presenta este boleto digital al momento del vuelo
• Llega al aeropuerto 1 hora antes del vuelo
• Porta un documento de identidad válido
• Guarda este código: ${datos.codigo} para futuras consultas

¡Gracias por volar con nosotros!
Sistema de Reservas - Aerolínea Regional

---
Este es un email automático, no responder directamente
  `;
}

/**
 * Envía un email de confirmación simple (para testing)
 * @param {string} destinatario - Email del destinatario
 * @param {string} asunto - Asunto del email
 * @param {string} mensaje - Mensaje del email
 * @returns {Promise<boolean>} true si se envió correctamente
 */
async function enviarEmailSimple(destinatario, asunto, mensaje) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'sistema@aerolinea.com',
      to: destinatario,
      subject: asunto,
      text: mensaje
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email simple enviado a: ${destinatario}`);
    return true;

  } catch (error) {
    console.error('❌ Error enviando email simple:', error);
    throw error;
  }
}

module.exports = {
  enviarBoletoEmail,
  enviarEmailSimple,
  verificarConfiguracionEmail
};
