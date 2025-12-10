// 1. IMPORTACIONES
const express = require('express');
const http = require('http'); // Necesario para unir Express y Socket.IO
const { Server } = require('socket.io');
const cors = require('cors');

const { sequelize } = require('./database');
const Partida = require('./models/Partida'); // Al importarlo, Sequelize ya sabe que existe

const { unirseAPartida, crearPartida } = require('./gameLogic');

// 2. CONFIGURACIÓN INICIAL
const app = express();
app.use(cors()); // Permite conexiones desde cualquier origen (tu app Vue)
app.use(express.json()); // Permite recibir datos en formato JSON en las APIs

// 3. CREAR EL SERVIDOR HTTP
// Express normalmente crea esto solo, pero para usar WebSockets
// necesitamos acceso explícito al servidor HTTP.
const server = http.createServer(app);

// 4. CONFIGURAR SOCKET.IO
const io = new Server(server, {
    cors: {
        origin: "*", // En producción, pon aquí la URL de tu app Vue
        methods: ["GET", "POST"]
    }
});

// --- ZONA A: WEBSOCKETS (Tiempo Real) ---

io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // TEST: El cliente nos envía un mensaje
    socket.on('test', (data) => {
        console.log('Mensaje recibido:', data);

        // Responder solo a ese cliente
        socket.emit('test-response', { msg: 'Recibido fuerte y claro' });
    });

    // Evento: Jugador quiere entrar a una partida
    socket.on('unirse-partida', async (data) => {
        unirseAPartida(io, socket, data);
    });

    // Evento: Jugador quiere crear un partida
    socket.on('crear-partida', async (data) => {
        const partida = crearPartida(socket, data);

        if (partida) {
            socket.emit('partida-creada', partida);
        }

    });

    // Evento: Desconexión
    socket.on('disconnect', () => {
        console.log('❌ Cliente desconectado');
    });
});
// --- ZONA B: API REST (Peticiones Clásicas) ---

// Endpoint de prueba
app.get('/api/saludo', (req, res) => {
    res.json({ mensaje: 'Hola desde la API REST tradicional' });
});

/**
 * EJEMPLO PODEROSO: API que dispara WebSocket
 * Imagina que un administrador actualiza un precio desde un panel web.
 * Llama a esta API, y la API avisa a TODOS los móviles conectados.
 */
app.post('/api/actualizar-datos', (req, res) => {
    const { nuevoDato } = req.body;

    console.log('🔄 API recibida. Actualizando a todos los clientes...');

    // Aquí guardarias en base de datos... y luego:

    // EMITIR A TODOS LOS SOCKETS CONECTADOS
    io.emit('notificacion-global', {
        tipo: 'ACTUALIZACION',
        contenido: nuevoDato,
        fecha: new Date()
    });

    res.json({ success: true, mensaje: 'Datos actualizados y notificados' });
});

// --- 5. ARRANCAR SERVIDOR Y BASE DE DATOS ---
const PORT = 3000;

async function arrancarServidor() {
    try {
        // A. Sincronizar Base de Datos
        // Esto mira tus archivos en 'models' y crea las tablas si no existen.
        await sequelize.sync({ force: false });
        console.log('📦 Base de datos sincronizada y tablas listas.');

        // B. Iniciar el servidor Web
        server.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error fatal al iniciar:', error);
    }
}

arrancarServidor();