const fetch = require('node-fetch');

async function testBuscarVuelos() {
    const origen = 'Santiago';
    const destino = 'Concepción';
    const fecha = '2025-09-16'; // Asegúrate que coincide con la base de datos

    const url = `http://localhost:3000/api/vuelos/buscar?origen=${origen}&destino=${destino}&fecha=${fecha}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Respuesta del API:', data);
    } catch (error) {
        console.error('Error al llamar al API:', error);
    }
}

testBuscarVuelos();
