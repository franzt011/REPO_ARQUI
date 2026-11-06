/** Pruebas de la base: crear-handler (rutas, errores, idioma), autenticación y chaos. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { crearHandler } = require('../src/compartido/crear-handler');
const { ok } = require('../src/compartido/respuestas-http');
const { NoEncontradoError } = require('../src/compartido/errores');
const { obtenerUsuarioId } = require('../src/compartido/autenticacion');
const { inyectarFallas } = require('../src/compartido/inyectar-fallas');

const rutas = {
  'GET /publica': async () => ok({ hola: 'mundo' }),
  'GET /privada': async (pedido) => ok({ usuarioId: pedido.usuarioId }),
  'GET /falla': async () => {
    throw new NoEncontradoError('curso-no-encontrado', 'No existe el curso x.');
  },
  'GET /explota': async () => {
    throw new TypeError('bug');
  },
};
const handler = crearHandler(rutas, { publicas: ['GET /publica'] });
const cuerpo = (respuesta) => JSON.parse(respuesta.body);
const conToken = (routeKey, extra = {}) => ({
  routeKey,
  requestContext: { authorizer: { jwt: { claims: { sub: 'usuario-123' } } } },
  ...extra,
});

test('una ruta pública responde sin token', async () => {
  const respuesta = await handler({ routeKey: 'GET /publica' });
  assert.equal(respuesta.statusCode, 200);
  assert.deepEqual(cuerpo(respuesta), { hola: 'mundo' });
});

test('una ruta privada sin token responde 401', async () => {
  const respuesta = await handler({ routeKey: 'GET /privada' });
  assert.equal(respuesta.statusCode, 401);
  assert.equal(cuerpo(respuesta).codigo, 'sin-token');
});

test('una ruta privada recibe el usuario del token de Cognito', async () => {
  const respuesta = await handler(conToken('GET /privada'));
  assert.deepEqual(cuerpo(respuesta), { usuarioId: 'usuario-123' });
});

test('un error de negocio se convierte en su código HTTP y se traduce al inglés', async () => {
  const respuesta = await handler(conToken('GET /falla', { headers: { 'accept-language': 'en-US' } }));
  assert.equal(respuesta.statusCode, 404);
  assert.deepEqual(cuerpo(respuesta), { codigo: 'curso-no-encontrado', mensaje: 'The course does not exist.' });
});

test('un error inesperado responde 500 sin mostrar el detalle', async (t) => {
  t.mock.method(console, 'error', () => {});
  const respuesta = await handler(conToken('GET /explota'));
  assert.equal(respuesta.statusCode, 500);
  assert.equal(cuerpo(respuesta).codigo, 'error-interno');
});

test('un JSON mal escrito responde 400', async () => {
  const respuesta = await handler(conToken('GET /privada', { body: '{malo' }));
  assert.equal(respuesta.statusCode, 400);
});

test('una ruta que no existe responde 404', async () => {
  const respuesta = await handler(conToken('GET /no-existe'));
  assert.equal(respuesta.statusCode, 404);
});

test('en modo desarrollo el usuario viene del encabezado x-usuario-id', (t) => {
  t.after(() => delete process.env.AUTH_MODO);
  process.env.AUTH_MODO = 'desarrollo';
  assert.equal(obtenerUsuarioId({ headers: { 'x-usuario-id': 'admin-1' } }), 'admin-1');
});

test('chaos: con CHAOS_TASA_FALLAS=1 siempre falla y en 0 nunca', async (t) => {
  t.after(() => delete process.env.CHAOS_TASA_FALLAS);
  process.env.CHAOS_TASA_FALLAS = '1';
  await assert.rejects(inyectarFallas(), { codigo: 'error-simulado' });
  process.env.CHAOS_TASA_FALLAS = '0';
  await inyectarFallas();
});
