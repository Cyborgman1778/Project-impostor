// 1. IMPORTACIONES
const express = require('express');
const http = require('http'); // Necesario para unir Express y Socket.IO
const { Server } = require('socket.io');
const cors = require('cors');

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
  console.log(`⚡ Cliente conectado: ${socket.id}`);

  // Evento: El cliente nos envía un mensaje
  socket.on('mensaje-desde-movil', (data) => {
    console.log('Mensaje recibido:', data);
    
    // Responder solo a ese cliente
    socket.emit('respuesta-servidor', { msg: 'Recibido fuerte y claro' });
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

// 5. ARRANCAR EL SERVIDOR
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});