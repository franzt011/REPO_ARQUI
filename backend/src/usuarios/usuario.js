/**
 * Entidad Usuario: reglas de negocio de una cuenta, sin base de datos ni HTTP.
 * La contraseña NO está aquí: la guarda y la valida Amazon Cognito.
 */
const { ReglaDeNegocioError, SinPermisoError, esTextoConContenido } = require('../compartido/errores');

const ROLES = ['admin', 'docente', 'alumno'];
const SEDES = ['Santiago', 'Concepcion'];

function invalido(mensaje) {
  return new ReglaDeNegocioError('usuario-invalido', mensaje);
}

class Usuario {
  constructor(datos) {
    this.usuarioId = datos.usuarioId;
    this.nombre = datos.nombre;
    this.correo = datos.correo;
    this.rol = datos.rol;
    this.sede = datos.sede;
    this.activo = datos.activo ?? true;
    this.fechaCreacion = datos.fechaCreacion;
  }

  /** Crea un usuario nuevo validando sus datos. Si algo no cumple, lanza un error. */
  static crear(datos) {
    if (!esTextoConContenido(datos.nombre)) {
      throw invalido('El usuario necesita un nombre.');
    }
    if (typeof datos.correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
      throw invalido('El correo no es válido.');
    }
    if (!ROLES.includes(datos.rol)) {
      throw invalido(`El rol "${datos.rol}" no existe. Usa: ${ROLES.join(', ')}.`);
    }
    if (datos.sede !== undefined && !SEDES.includes(datos.sede)) {
      throw invalido(`La sede "${datos.sede}" no existe. Usa: ${SEDES.join(', ')}.`);
    }
    return new Usuario({ ...datos, correo: datos.correo.toLowerCase(), activo: true });
  }

  /** Reconstruye un usuario ya guardado (lo usan los repositorios al leer). */
  static restaurar(datos) {
    return new Usuario(datos);
  }

  /** Datos simples para guardar en la base de datos o devolver como JSON. */
  datos() {
    return {
      usuarioId: this.usuarioId,
      nombre: this.nombre,
      correo: this.correo,
      rol: this.rol,
      sede: this.sede,
      activo: this.activo,
      fechaCreacion: this.fechaCreacion,
    };
  }

  /** Un administrador no puede cambiarse a sí mismo: así el sistema nunca queda sin admin. */
  exigirNoEsElMismo(solicitante) {
    if (solicitante.usuarioId === this.usuarioId) {
      throw new SinPermisoError('cambio-propio', 'No puedes cambiar tu propia cuenta.');
    }
  }

  cambiarRol(nuevoRol, solicitante) {
    this.exigirNoEsElMismo(solicitante);
    if (!ROLES.includes(nuevoRol)) {
      throw new ReglaDeNegocioError('rol-invalido', `El rol "${nuevoRol}" no existe.`);
    }
    this.rol = nuevoRol;
  }

  /** Desactivar no borra la cuenta: el usuario deja de poder usar la API, pero su historial queda. */
  cambiarEstado(activo, solicitante) {
    this.exigirNoEsElMismo(solicitante);
    this.activo = activo === true;
  }
}

module.exports = { Usuario, ROLES, SEDES };
