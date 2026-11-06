/**
 * Arma el handler de una Lambda a partir de su tabla de rutas.
 *
 * Cada módulo (usuarios, cursos, alumnos) define sus rutas así:
 *
 *   const rutas = {
 *     'GET /gestion/cursos': async (pedido, d) => ok(await listarMisCursosDocente(d, pedido.usuarioId)),
 *   };
 *   module.exports.handler = crearHandler(rutas);
 *
 * Aquí está el ÚNICO try/catch de la API: cualquier error que lance un caso de
 * uso llega a este catch y se convierte en una respuesta HTTP con su código
 * (404, 403, 422...). Así los casos de uso no saben nada de HTTP.
 */
const {
  ErrorDeNegocio,
  DatosInvalidosError,
  NoAutenticadoError,
  SinPermisoError,
  NoEncontradoError,
  ConflictoError,
  ReglaDeNegocioError,
} = require('./errores');
const { responder } = require('./respuestas-http');
const { elegirIdioma, traducir } = require('./mensajes-es-en');
const { obtenerUsuarioId } = require('./autenticacion');
const { inyectarFallas } = require('./inyectar-fallas');
const { obtenerDependencias } = require('./dependencias');

function estadoHttpDe(error) {
  if (error instanceof DatosInvalidosError) return 400;
  if (error instanceof NoAutenticadoError) return 401;
  if (error instanceof SinPermisoError) return 403;
  if (error instanceof NoEncontradoError) return 404;
  if (error instanceof ConflictoError) return 409;
  if (error instanceof ReglaDeNegocioError) return 422;
  return 500;
}

function respuestaDeError(error, idioma) {
  if (!(error instanceof ErrorDeNegocio)) {
    // Error de programación o de AWS: se registra completo, pero al cliente no se le muestra el detalle
    console.error(error);
    return responder(500, { codigo: 'error-interno', mensaje: traducir('error-interno', idioma) });
  }
  return responder(estadoHttpDe(error), {
    codigo: error.codigo,
    mensaje: traducir(error.codigo, idioma, error.message),
  });
}

function leerCuerpo(event) {
  if (!event.body) {
    return {};
  }
  const texto = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(texto);
  } catch {
    throw new DatosInvalidosError('json-invalido', 'El cuerpo de la solicitud no es un JSON válido.');
  }
}

/**
 * Observabilidad: una línea JSON por petición. En CloudWatch Logs Insights se
 * puede filtrar y graficar por ruta, estado y duración (latencia, tráfico y
 * errores son tres de las Golden Signals).
 */
function registrarEnLog(event, respuesta, inicio) {
  console.log(
    JSON.stringify({
      ruta: event.routeKey,
      estado: respuesta.statusCode,
      duracionMs: Date.now() - inicio,
      version: respuesta.headers['X-App-Version'],
    }),
  );
}

/**
 * @param rutas   objeto { 'METODO /ruta': async (pedido, dependencias) => respuesta }
 * @param opciones.publicas  rutas que no exigen iniciar sesión
 */
function crearHandler(rutas, { publicas = [] } = {}) {
  return async function handler(event) {
    const inicio = Date.now();
    const idioma = elegirIdioma(event.headers);
    let respuesta;

    try {
      await inyectarFallas();

      const ruta = rutas[event.routeKey];
      if (!ruta) {
        throw new NoEncontradoError('ruta-no-encontrada', `La ruta ${event.routeKey} no existe.`);
      }

      const pedido = {
        usuarioId: publicas.includes(event.routeKey) ? null : obtenerUsuarioId(event),
        params: event.pathParameters || {},
        query: event.queryStringParameters || {},
        cuerpo: leerCuerpo(event),
      };
      respuesta = await ruta(pedido, obtenerDependencias());
    } catch (error) {
      respuesta = respuestaDeError(error, idioma);
    }

    registrarEnLog(event, respuesta, inicio);
    return respuesta;
  };
}

module.exports = { crearHandler, estadoHttpDe };
