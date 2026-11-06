/**
 * GET /salud — responde si la API está viva y qué versión respondió.
 * Es público (no pide token) y no toca la base de datos.
 */
const { crearHandler } = require('../compartido/crear-handler');
const { ok, versionDeLaFuncion } = require('../compartido/respuestas-http');

const rutas = {
  'GET /salud': async () => ok({ estado: 'ok', version: versionDeLaFuncion() }),
};

const publicas = ['GET /salud'];

module.exports = { rutas, publicas, handler: crearHandler(rutas, { publicas }) };
