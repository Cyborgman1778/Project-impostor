// models/Partida.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database'); // Importamos la conexión (nota los dos puntos ..)

const Partida = sequelize.define('Partida', {
  // CLAVE PRIMARIA: El código de la sala (ej: "A1B2C3")
  codigo: {
    type: DataTypes.STRING(6),
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  
  // CAMPO DE JUGADORES (Array guardado como Texto)
  jugadores: {
    type: DataTypes.TEXT, 
    defaultValue: '[]', // Empieza vacía
    // 1. Al LEER de la BD: Convierte Texto -> Array JS
    get() {
      const rawValue = this.getDataValue('jugadores');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    // 2. Al GUARDAR en la BD: Convierte Array JS -> Texto
    set(value) {
      this.setDataValue('jugadores', JSON.stringify(value));
    }
  },

  // (Opcional) Puedes añadir más cosas si quieres
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'esperando' // esperando, jugando, terminada
  },

  max_jugadores: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    allowNull: false
  },

  num_impostores: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  }
});

module.exports = Partida;