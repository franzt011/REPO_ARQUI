/**
 * Respuestas HTTP en el formato que espera API Gateway (HTTP API) de una Lambda:
 * { statusCode, headers, body }.
 *
 * Todos los handlers responden con estas funciones, así todas las respuestas
 * del sistema tienen la misma forma.
 */

/**
 * Número de versión de la Lambda que respondió ("1", "2"... o "$LATEST").
 * Sirve en el despliegue canario: el generador de carga cuenta las respuestas
 * por versión leyendo este encabezado.
 */
function versionDeLaFuncion() {
  return process.env.AWS_LAMBDA_FUNCTION_VERSION || 'local';
}

function responder(estado, cuerpo) {
  return {
    statusCode: estado,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-App-Version': versionDeLaFuncion(),
    },
    body: cuerpo === undefined ? '' : JSON.stringify(cuerpo),
  };
}

/** 200: todo bien, con datos. */
function ok(datos) {
  return responder(200, datos);
}

/** 201: se creó algo nuevo. */
function creado(datos) {
  return responder(201, datos);
}

/** 204: todo bien, sin datos que devolver (por ejemplo al eliminar). */
function sinContenido() {
  return responder(204);
}

module.exports = { responder, ok, creado, sinContenido, versionDeLaFuncion };
