// frontend/js/app.js

/**
 * Configuración de la API
 */
const API_BASE_URL = window.location.origin;
const API_ENDPOINTS = {
    BUSCAR_VUELOS: `${API_BASE_URL}/api/vuelos/buscar`,
    COMPRAR_BOLETO: `${API_BASE_URL}/api/compras`,
    CONSULTAR_COMPRA: `${API_BASE_URL}/api/compras`
};

/**
 * Variables globales
 */
let vueloSeleccionado = null;

/**
 * Inicialización cuando se carga el DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

/**
 * Inicializa la página según el contexto
 */
function initializePage() {
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'index':
            initializeSearchPage();
            break;
        case 'resultados':
            initializeResultsPage();
            break;
        case 'compra':
            initializePurchasePage();
            break;
    }
    
    // Configurar navegación suave
    setupSmoothScrolling();
    
    // Configurar fecha mínima en todos los inputs de fecha
    setupDateInputs();
}

/**
 * Detecta la página actual basada en la URL
 * @returns {string} Nombre de la página actual
 */
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('resultados')) return 'resultados';
    if (path.includes('compra')) return 'compra';
    return 'index';
}

/**
 * Inicializa la página de búsqueda (index.html)
 */
function initializeSearchPage() {
    const searchForm = document.getElementById('searchForm');
    const fechaInput = document.getElementById('fecha');
    
    if (!searchForm || !fechaInput) return;
    
    // Configurar fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];
    fechaInput.min = today;
    fechaInput.value = today;
    
    // Configurar validación en tiempo real
    setupFormValidation();
    
    // Manejar envío del formulario
    searchForm.addEventListener('submit', handleSearchSubmit);
    
    // Evitar seleccionar mismo origen y destino
    setupOriginDestinationValidation();
}

/**
 * Configura los inputs de fecha
 */
function setupDateInputs() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    
    dateInputs.forEach(input => {
        if (input.min === '') {
            input.min = today;
        }
    });
}

/**
 * Configura la validación del formulario de búsqueda
 */
function setupFormValidation() {
    const origenSelect = document.getElementById('origen');
    const destinoSelect = document.getElementById('destino');
    
    if (origenSelect && destinoSelect) {
        origenSelect.addEventListener('change', validateOriginDestination);
        destinoSelect.addEventListener('change', validateOriginDestination);
    }
}

/**
 * Valida que origen y destino no sean iguales
 */
function validateOriginDestination() {
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;
    
    if (origen && destino && origen === destino) {
        showMessage('El origen y destino no pueden ser iguales', 'error');
        document.getElementById('destino').value = '';
    }
}

/**
 * Configura la validación de origen y destino
 */
function setupOriginDestinationValidation() {
    const origenSelect = document.getElementById('origen');
    const destinoSelect = document.getElementById('destino');
    
    if (!origenSelect || !destinoSelect) return;
    
    function updateDestinationOptions() {
        const selectedOrigen = origenSelect.value;
        const destinoOptions = destinoSelect.querySelectorAll('option');
        
        destinoOptions.forEach(option => {
            if (option.value === selectedOrigen && option.value !== '') {
                option.style.display = 'none';
                if (destinoSelect.value === selectedOrigen) {
                    destinoSelect.value = '';
                }
            } else {
                option.style.display = 'block';
            }
        });
    }
    
    origenSelect.addEventListener('change', updateDestinationOptions);
}

/**
 * Maneja el envío del formulario de búsqueda
 * @param {Event} event - Evento del formulario
 */
async function handleSearchSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    // Convertir la fecha a YYYY-MM-DD
    const fechaInput = formData.get('fecha');
    const fechaObj = new Date(fechaInput);
    const fechaFormateada = fechaObj.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const searchParams = {
        origen: formData.get('origen'),
        destino: formData.get('destino'),
        fecha: fechaFormateada
    };

    // Validar datos
    if (!validateSearchParams(searchParams)) {
        return;
    }

    // Mostrar loading
    showLoadingOverlay(true);
    toggleSubmitButton(true);

    try {
        const vuelos = await buscarVuelos(searchParams);

        if (vuelos && vuelos.length > 0) {
            // Guardar criterios de búsqueda y resultados
            sessionStorage.setItem('searchCriteria', JSON.stringify(searchParams));
            sessionStorage.setItem('searchResults', JSON.stringify(vuelos));

            // Redirigir a página de resultados
            window.location.href = '/resultados';
        } else {
            showMessage('No se encontraron vuelos disponibles con esos criterios', 'info');
        }

    } catch (error) {
        console.error('Error en búsqueda:', error);
        showMessage('Error al buscar vuelos. Inténtalo nuevamente.', 'error');
    } finally {
        showLoadingOverlay(false);
        toggleSubmitButton(false);
    }
}


/**
 * Valida los parámetros de búsqueda
 * @param {Object} params - Parámetros de búsqueda
 * @returns {boolean} true si son válidos
 */
function validateSearchParams(params) {
    if (!params.origen || !params.destino || !params.fecha) {
        showMessage('Por favor completa todos los campos', 'error');
        return false;
    }
    
    if (params.origen === params.destino) {
        showMessage('El origen y destino deben ser diferentes', 'error');
        return false;
    }
    
    const fechaSeleccionada = new Date(params.fecha);
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < fechaActual) {
        showMessage('La fecha de salida no puede ser anterior a hoy', 'error');
        return false;
    }
    
    return true;
}

/**
 * Busca vuelos en el API
 * @param {Object} params - Parámetros de búsqueda
 * @returns {Promise<Array>} Lista de vuelos encontrados
 */
async function buscarVuelos(params) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_ENDPOINTS.BUSCAR_VUELOS}?${queryString}`;
    
    console.log('Buscando vuelos:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Error en la búsqueda');
    }
    
    // El API puede devolver { vuelos: [...] } o directamente [...]
    return data.vuelos || data;
}

/**
 * Inicializa la página de resultados
 */
function initializeResultsPage() {
    const searchCriteria = JSON.parse(sessionStorage.getItem('searchCriteria') || '{}');
    const searchResults = JSON.parse(sessionStorage.getItem('searchResults') || '[]');
    
    if (!searchCriteria.origen || searchResults.length === 0) {
        // Si no hay datos de búsqueda, redirigir al inicio
        window.location.href = '/';
        return;
    }
    
    displaySearchSummary(searchCriteria);
    displayFlightResults(searchResults);
}

/**
 * Muestra el resumen de la búsqueda
 * @param {Object} criteria - Criterios de búsqueda
 */
function displaySearchSummary(criteria) {
    const container = document.querySelector('.search-summary');
    if (!container) return;
    
    const fechaFormateada = formatearFecha(criteria.fecha);
    
    container.innerHTML = `
        <h2>Vuelos encontrados</h2>
        <div class="search-criteria">
            <strong>${criteria.origen}</strong> → <strong>${criteria.destino}</strong> 
            el <strong>${fechaFormateada}</strong>
        </div>
    `;
}

/**
 * Muestra los resultados de vuelos
 * @param {Array} vuelos - Lista de vuelos
 */
function displayFlightResults(vuelos) {
    const container = document.querySelector('.vuelos-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    vuelos.forEach(vuelo => {
        const vueloCard = createFlightCard(vuelo);
        container.appendChild(vueloCard);
    });
}

/**
 * Crea una tarjeta de vuelo
 * @param {Object} vuelo - Datos del vuelo
 * @returns {HTMLElement} Elemento de la tarjeta
 */
function createFlightCard(vuelo) {
    const card = document.createElement('div');
    card.className = 'vuelo-card';
    
    const fechaHora = new Date(vuelo.fecha_salida);
    const horaFormateada = fechaHora.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const fechaFormateada = fechaHora.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    
    const precioFormateado = vuelo.precio_formateado || `$${vuelo.precio.toLocaleString('es-CL')}`;
    
    card.innerHTML = `
        <div class="vuelo-header">
            <div class="vuelo-route">
                <span class="city">${vuelo.origen}</span>
                <span class="arrow">✈️</span>
                <span class="city">${vuelo.destino}</span>
            </div>
            <div class="vuelo-price">${precioFormateado}</div>
        </div>
        
        <div class="vuelo-details">
            <div class="detail-item">
                <span class="detail-icon">🕒</span>
                <span>Salida: ${horaFormateada}</span>
            </div>
            <div class="detail-item">
                <span class="detail-icon">📅</span>
                <span>${fechaFormateada}</span>
            </div>
            <div class="detail-item">
                <span class="detail-icon">💺</span>
                <span>${vuelo.asientos_disponibles} asientos disponibles</span>
            </div>
        </div>
        
        <button class="comprar-btn" onclick="seleccionarVuelo(${vuelo.id})">
            Seleccionar este vuelo
        </button>
    `;
    
    return card;
}

/**
 * Selecciona un vuelo para compra
 * @param {number} vueloId - ID del vuelo seleccionado
 */
window.seleccionarVuelo = function(vueloId) {
    const searchResults = JSON.parse(sessionStorage.getItem('searchResults') || '[]');
    const vuelo = searchResults.find(v => v.id === vueloId);
    
    if (vuelo) {
        sessionStorage.setItem('selectedFlight', JSON.stringify(vuelo));
        window.location.href = '/compra';
    } else {
        showMessage('Error al seleccionar el vuelo', 'error');
    }
};

/**
 * Inicializa la página de compra
 */
function initializePurchasePage() {
    const selectedFlight = JSON.parse(sessionStorage.getItem('selectedFlight') || '{}');
    
    if (!selectedFlight.id) {
        window.location.href = '/';
        return;
    }
    
    vueloSeleccionado = selectedFlight;
    displayFlightSummary(selectedFlight);
    setupPurchaseForm();
}

/**
 * Muestra el resumen del vuelo seleccionado
 * @param {Object} vuelo - Datos del vuelo
 */
function displayFlightSummary(vuelo) {
    const container = document.querySelector('.vuelo-summary');
    if (!container) return;
    
    const fechaHora = new Date(vuelo.fecha_salida);
    const fechaFormateada = fechaHora.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const precioFormateado = vuelo.precio_formateado || `$${vuelo.precio.toLocaleString('es-CL')}`;
    
    container.innerHTML = `
        <h3 class="summary-title">Resumen de tu vuelo</h3>
        <div class="summary-details">
            <div class="summary-item">
                <span><strong>Ruta:</strong></span>
                <span>${vuelo.origen} → ${vuelo.destino}</span>
            </div>
            <div class="summary-item">
                <span><strong>Fecha y hora:</strong></span>
                <span>${fechaFormateada}</span>
            </div>
            <div class="summary-item">
                <span><strong>Precio:</strong></span>
                <span>${precioFormateado}</span>
            </div>
            <div class="summary-item">
                <span><strong>Asientos disponibles:</strong></span>
                <span>${vuelo.asientos_disponibles}</span>
            </div>
        </div>
    `;
}

/**
 * Configura el formulario de compra
 */
function setupPurchaseForm() {
    const purchaseForm = document.getElementById('purchaseForm');
    if (!purchaseForm) return;
    
    purchaseForm.addEventListener('submit', handlePurchaseSubmit);
    
    // Validación en tiempo real del email
    const emailInput = document.getElementById('correo_usuario');
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', clearEmailError);
    }
}

/**
 * Valida el formato del email
 * @param {Event} event - Evento del input
 */
function validateEmail(event) {
    const email = event.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        event.target.style.borderColor = '#ef4444';
        showMessage('Por favor ingresa un email válido', 'error');
    } else {
        event.target.style.borderColor = '#e5e7eb';
    }
}

/**
 * Limpia el error del email
 * @param {Event} event - Evento del input
 */
function clearEmailError(event) {
    event.target.style.borderColor = '#e5e7eb';
}

/**
 * Maneja el envío del formulario de compra
 * @param {Event} event - Evento del formulario
 */
async function handlePurchaseSubmit(event) {
    event.preventDefault();
    
    if (!vueloSeleccionado) {
        showMessage('Error: No hay vuelo seleccionado', 'error');
        return;
    }
    
    const formData = new FormData(event.target);
    const correoUsuario = formData.get('correo_usuario');
    
    // Validar email
    if (!correoUsuario || !validateEmailFormat(correoUsuario)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }
    
    // Mostrar loading
    const submitBtn = event.target.querySelector('.finalizar-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Procesando compra...';
    
    try {
        const compraData = {
            vuelo_id: vueloSeleccionado.id,
            correo_usuario: correoUsuario
        };
        
        const resultado = await procesarCompra(compraData);
        
        if (resultado.success) {
            // Limpiar datos de sesión
            sessionStorage.removeItem('selectedFlight');
            sessionStorage.removeItem('searchResults');
            sessionStorage.removeItem('searchCriteria');
            
            // Mostrar mensaje de éxito y redirigir
            showPurchaseSuccess(resultado.data);
            
            // Redirigir después de 5 segundos
            setTimeout(() => {
                window.location.href = '/';
            }, 5000);
            
        } else {
            throw new Error(resultado.message || 'Error en la compra');
        }
        
    } catch (error) {
        console.error('Error en compra:', error);
        showMessage(`Error al procesar la compra: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Valida el formato de un email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
function validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Procesa la compra en el API
 * @param {Object} compraData - Datos de la compra
 * @returns {Promise<Object>} Resultado de la compra
 */
async function procesarCompra(compraData) {
    console.log('Procesando compra:', compraData);
    
    const response = await fetch(API_ENDPOINTS.COMPRAR_BOLETO, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(compraData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        return {
            success: false,
            message: data.error || 'Error en la compra'
        };
    }
    
    return {
        success: true,
        data: data
    };
}

/**
 * Muestra mensaje de éxito de compra
 * @param {Object} compraData - Datos de la compra exitosa
 */
function showPurchaseSuccess(compraData) {
    const container = document.querySelector('.purchase-form-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
            <h2 style="color: #10b981; margin-bottom: 1rem;">¡Compra Exitosa!</h2>
            <p style="margin-bottom: 2rem; font-size: 1.1rem; color: #6b7280;">
                Tu boleto ha sido enviado a <strong>${compraData.correo_usuario}</strong>
            </p>
            
            <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #e0f2fe;">
                <h3 style="color: #1f2937; margin-bottom: 1rem;">Código de tu boleto:</h3>
                <div style="font-size: 1.5rem; font-weight: bold; color: #667eea; letter-spacing: 2px; font-family: monospace;">
                    ${compraData.codigo_boleto}
                </div>
            </div>
            
            <div style="text-align: left; background: #fff3cd; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #ffeaa7;">
                <h4 style="margin-bottom: 1rem; color: #856404;">📋 Instrucciones importantes:</h4>
                <ul style="color: #856404; line-height: 1.6;">
                    <li>Revisa tu correo electrónico para ver el boleto completo</li>
                    <li>Guarda el código de boleto para futuras consultas</li>
                    <li>Llega al aeropuerto 1 hora antes del vuelo</li>
                    <li>Presenta un documento de identidad válido</li>
                </ul>
            </div>
            
            <p style="color: #6b7280; margin-bottom: 1rem;">
                Serás redirigido al inicio en 5 segundos...
            </p>
            
            <button onclick="window.location.href='/'" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                Volver al inicio
            </button>
        </div>
    `;
}

/**
 * Muestra/oculta el overlay de carga
 * @param {boolean} show - Mostrar o ocultar
 */
function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Habilita/deshabilita el botón de envío
 * @param {boolean} loading - Estado de carga
 */
function toggleSubmitButton(loading) {
    const submitBtn = document.querySelector('.search-btn');
    if (!submitBtn) return;
    
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    if (loading) {
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'flex';
    } else {
        submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Muestra un mensaje al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (error, success, info)
 */
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    const content = document.getElementById('messageContent');
    const text = document.getElementById('messageText');
    
    if (!container || !content || !text) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    // Configurar el mensaje
    text.textContent = message;
    content.className = `message-content ${type}`;
    container.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

/**
 * Oculta el mensaje
 */
function hideMessage() {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Formatea una fecha para mostrar
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Configura la navegación suave
 */
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Maneja el cierre de mensajes
 */
document.addEventListener('click', function(e) {
    if (e.target.id === 'closeMessage') {
        hideMessage();
    }
});

// Manejo de errores globales
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    showMessage('Ha ocurrido un error inesperado', 'error');
});

// Log de inicialización
console.log('AeroReservas - Sistema cargado correctamente');
console.log('API Base URL:', API_BASE_URL);
console.log('Página actual:', getCurrentPage());