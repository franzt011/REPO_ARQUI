/**
 * Raíz de composición: el ÚNICO lugar que decide qué implementación concreta
 * usa cada caso de uso (inyección de dependencias de Clean Architecture).
 *
 *   REPOSITORIOS=memoria → datos en memoria (pruebas y servidor local)
 *   REPOSITORIOS=dynamo  → DynamoDB y Cognito (en AWS; lo fija serverless.yml)
 *
 * Los casos de uso reciben este objeto "d" y solo llaman a sus métodos
 * (d.cursos.buscarPorId, d.usuarios.guardar...). No saben si detrás hay un Map
 * o DynamoDB: por eso cambiar la base de datos no obliga a tocarlos.
 *
 * Cada repositorio se crea recién la primera vez que se usa. Así la Lambda de
 * cursos no carga el código de alumnos si no lo necesita (cold start más corto).
 */
const { randomUUID } = require('node:crypto');

function crearDependencias({ modo = process.env.REPOSITORIOS || 'memoria', reemplazos = {} } = {}) {
  const enDynamo = modo === 'dynamo';
  const creados = {};

  // Crea el repositorio la primera vez y después devuelve siempre el mismo
  function una(nombre, crear) {
    if (nombre in reemplazos) return reemplazos[nombre];
    if (!(nombre in creados)) creados[nombre] = crear();
    return creados[nombre];
  }

  const d = {
    reloj: reemplazos.reloj || { ahora: () => new Date() },
    ids: reemplazos.ids || { nuevo: () => randomUUID() },

    // ── Usuarios ─────────────────────────────────────────────
    get usuarios() {
      return una('usuarios', () =>
        enDynamo
          ? new (require('../usuarios/repositorio-usuarios-dynamo'))()
          : new (require('../usuarios/repositorio-usuarios-memoria'))(),
      );
    },
    get cuentas() {
      return una('cuentas', () =>
        enDynamo ? new (require('../usuarios/cuentas-cognito'))() : new (require('../usuarios/cuentas-memoria'))(),
      );
    },

    // ── Cursos ───────────────────────────────────────────────
    get cursos() {
      return una('cursos', () =>
        enDynamo
          ? new (require('../cursos/repositorio-cursos-dynamo'))()
          : new (require('../cursos/repositorio-cursos-memoria'))(),
      );
    },
    get examenes() {
      return una('examenes', () =>
        enDynamo
          ? new (require('../cursos/repositorio-examenes-dynamo'))()
          : new (require('../cursos/repositorio-examenes-memoria'))(),
      );
    },
    get videos() {
      return una('videos', () => require('../cursos/verificador-enlaces-video').verificadorCompartido());
    },

    // ── Alumnos ──────────────────────────────────────────────
    get inscripciones() {
      return una('inscripciones', () =>
        enDynamo
          ? new (require('../alumnos/repositorio-inscripciones-dynamo'))()
          : new (require('../alumnos/repositorio-inscripciones-memoria'))(),
      );
    },
    get certificados() {
      return una('certificados', () =>
        enDynamo
          ? new (require('../alumnos/repositorio-certificados-dynamo'))()
          : new (require('../alumnos/repositorio-certificados-memoria'))(),
      );
    },
    get intentos() {
      // En memoria, guardar una rendición escribe también en inscripciones y certificados
      return una('intentos', () =>
        enDynamo
          ? new (require('../alumnos/repositorio-intentos-dynamo'))()
          : new (require('../alumnos/repositorio-intentos-memoria'))(d.inscripciones, d.certificados),
      );
    },
  };
  return d;
}

// Una Lambda reutiliza su contenedor entre peticiones: las dependencias se crean una sola vez
let compartidas;
function obtenerDependencias() {
  if (!compartidas) compartidas = crearDependencias();
  return compartidas;
}

/** Lo usa el servidor local para cargar los datos de ejemplo en las mismas dependencias. */
function fijarDependencias(d) {
  compartidas = d;
}

module.exports = { crearDependencias, obtenerDependencias, fijarDependencias };
