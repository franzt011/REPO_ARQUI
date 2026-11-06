/**
 * ¿Quién hace la petición?
 *
 * En AWS: API Gateway valida el token de Cognito ANTES de llamar a la Lambda
 * (JWT authorizer en serverless.yml). Si el token es falso o venció, la Lambda
 * ni siquiera se ejecuta. Aquí solo leemos el "sub" (id del usuario) que viene
 * dentro del token ya validado.
 *
 * En tu computador (AUTH_MODO=desarrollo) no hay Cognito: el usuario se indica
 * con el encabezado x-usuario-id (por ejemplo "admin-1").
 *
 * Esto solo dice QUIÉN es. QUÉ puede hacer lo decide cada caso de uso según el
 * rol guardado en la tabla Usuarios (ver buscar-o-fallar.js → exigirUsuario).
 */
const { NoAutenticadoError } = require('./errores');

function estaEnModoDesarrollo() {
  return process.env.AUTH_MODO === 'desarrollo';
}

function obtenerUsuarioId(event) {
  if (estaEnModoDesarrollo()) {
    const encabezados = event.headers || {};
    const usuarioId = encabezados['x-usuario-id'];
    if (!usuarioId) {
      throw new NoAutenticadoError('sin-token', 'Falta el encabezado x-usuario-id (modo desarrollo).');
    }
    return usuarioId;
  }

  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims || !claims.sub) {
    throw new NoAutenticadoError('sin-token', 'Debes iniciar sesión.');
  }
  return claims.sub;
}

module.exports = { obtenerUsuarioId, estaEnModoDesarrollo };
