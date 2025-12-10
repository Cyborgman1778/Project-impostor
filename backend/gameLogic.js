// controllers/game_logic.js
const Partida = require('./models/Partida'); // Asegúrate de importar tu modelo

const randCode = () => {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

// Función para manejar la lógica de unirse
const unirseAPartida = async (io, socket, data) => {
    try {
        const { codigo, usuarioId } = data; //el frontend DEBE ENVIAR EL CODIGO COMO STRING

        // 1. Lógica de Base de Datos
        const partida = await Partida.findByPk(codigo);

        if (!partida) {
            // Es buena práctica avisar al usuario si hubo error
            socket.emit('error', 'La partida no existe');
            return;
        }

        // Lógica de añadir al array (usando la estrategia que vimos antes)
        const listaJugadores = partida.jugadores;
        if (!listaJugadores.includes(usuarioId)) {
            listaJugadores.push(usuarioId);
            partida.jugadores = listaJugadores; // Setter mágico de Sequelize
            await partida.save();
        }

        // 2. Lógica de WebSockets (Salas)
        socket.join(codigo);

        // Guardamos el código de la sala en el objeto socket para usarlo al desconectarse
        // Esto es un truco muy útil para saber de qué sala salió
        socket.data.salaActual = codigo;
        socket.data.usuarioId = usuarioId;

        console.log(`Socket ${socket.id} (User: ${usuarioId}) se unió a la sala ${codigo}`);

        // 3. Notificar a TODOS en esa sala
        io.to(codigo).emit('nuevo-jugador', {
            mensaje: `El jugador ${usuarioId} ha entrado`,
            jugadores: partida.jugadores
        });

    } catch (error) {
        console.error("Error en unirseAPartida:", error);
    }
};

const crearPartida = async (socket, data) => {
    try {
        const { usuarioId, max_jugadores, num_impostores } = data;

        if (!usuarioId) throw new Error("Falta el ID del usuario");

        let codigo;
        let disp = false;

        while (!disp) {
            codigo = randCode();
            const partida = await Partida.findByPk(codigo);
            if (!partida) {
                disp = true;
            }
        }

        socket.join(codigo);
        socket.data.salaActual = codigo;
        socket.data.usuarioId = usuarioId;

        let jugadores = [usuarioId];

        const nuevaPartida = await Partida.create({
            codigo: codigo,
            jugadores: jugadores,
            admin: usuarioId,
            ganador: 'empty',
            estado: 'esperando',
            max_jugadores: max_jugadores,
            num_impostores: num_impostores
        });

        console.log(`Sala ${codigo} creada por ${usuarioId}`);

        return nuevaPartida;
    }
    catch (error) {
        console.error("Error creando partida:", error);
        socket.emit('error', 'No se pudo crear la partida');
    }
};

const iniciarPartida = async (io, socket, data) => {
    try {
        const { codigo, usuarioId } = data;

        const partida = await Partida.findByPk(codigo);
        if (!partida) {
            socket.emit('error', 'La partida no existe');
            return;
        }

        io.to(codigo).emit('partida-iniciada', {
            mensaje: `El jugador ${usuarioId} ha iniciado la partida ${codigo}`
        });

    }
    catch{
        console.error("Error iniciando partida:", error);
        socket.emit('error', 'No se pudo iniciar la partida');        
    }
}

module.exports = {
    unirseAPartida,
    crearPartida,
    iniciarPartida
};