/**
 * Errores de negocio. No conocen HTTP: solo dicen QUÉ tipo de problema hubo.
 * crear-handler.js los traduce a un código HTTP (404, 403, 409...).
 *
 * Cada error lleva un "codigo" estable (por ejemplo 'curso-no-encontrado'),
 * que mensajes-es-en.js usa para responder en español o en inglés.
 */
class ErrorDeNegocio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = this.constructor.name;
    this.codigo = codigo;
  }
}

/** Faltan datos o vienen con mal formato (400). */
class DatosInvalidosError extends ErrorDeNegocio {}

/** No viene un token válido (401). */
class NoAutenticadoError extends ErrorDeNegocio {}

/** El usuario no tiene permiso para esta acción (403). */
class SinPermisoError extends ErrorDeNegocio {}

/** El recurso no existe (404). */
class NoEncontradoError extends ErrorDeNegocio {}

/** La acción choca con el estado actual, por ejemplo inscribirse dos veces (409). */
class ConflictoError extends ErrorDeNegocio {}

/** Los datos tienen buen formato pero rompen una regla de negocio (422). */
class ReglaDeNegocioError extends ErrorDeNegocio {}

/** Devuelve true si el valor es un texto con algo escrito. */
function esTextoConContenido(valor) {
  return typeof valor === 'string' && valor.trim() !== '';
}

module.exports = {
  ErrorDeNegocio,
  DatosInvalidosError,
  NoAutenticadoError,
  SinPermisoError,
  NoEncontradoError,
  ConflictoError,
  ReglaDeNegocioError,
  esTextoConContenido,
};
