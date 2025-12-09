// database.js
const { Sequelize } = require('sequelize');

// Configuración de la conexión
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './juego.sqlite', // Nombre del archivo que se creará solo
    logging: false // Poner en 'true' si quieres ver el SQL en la consola
});

module.exports = { sequelize };