/**
 * Internacionalización (i18n) de los mensajes de error.
 *
 * El backend responde en el idioma que pide el cliente con el encabezado
 * Accept-Language ("es" por defecto, "en" si lo pide). Cada error se busca por
 * su "codigo"; si un código no está aquí, se usa el mensaje original en español.
 */
const MENSAJES = {
  // Generales
  'error-interno': { es: 'Ocurrió un error inesperado.', en: 'An unexpected error occurred.' },
  'ruta-no-encontrada': { es: 'La ruta no existe.', en: 'The route does not exist.' },
  'json-invalido': { es: 'El cuerpo de la solicitud no es un JSON válido.', en: 'The request body is not valid JSON.' },
  'sin-token': { es: 'Debes iniciar sesión.', en: 'You must sign in.' },
  'error-simulado': { es: 'Falla simulada (chaos).', en: 'Simulated failure (chaos).' },

  // Usuarios
  'perfil-no-encontrado': { es: 'Tu cuenta no tiene perfil.', en: 'Your account has no profile.' },
  'usuario-inactivo': { es: 'Tu cuenta está desactivada.', en: 'Your account is disabled.' },
  'rol-no-permitido': { es: 'Tu rol no permite esta acción.', en: 'Your role does not allow this action.' },
  'usuario-invalido': { es: 'Los datos del usuario no son válidos.', en: 'The user data is not valid.' },
  'usuario-no-encontrado': { es: 'El usuario no existe.', en: 'The user does not exist.' },
  'usuario-existente': { es: 'Ya existe una cuenta con ese correo.', en: 'An account with that email already exists.' },
  'rol-invalido': { es: 'El rol no existe.', en: 'The role does not exist.' },
  'cambio-propio': { es: 'No puedes cambiar tu propia cuenta.', en: 'You cannot change your own account.' },
  'credenciales-invalidas': { es: 'Correo o contraseña incorrectos.', en: 'Wrong email or password.' },

  // Cursos
  'curso-no-encontrado': { es: 'El curso no existe.', en: 'The course does not exist.' },
  'curso-invalido': { es: 'Los datos del curso no son válidos.', en: 'The course data is not valid.' },
  'sin-permiso-curso': { es: 'Solo el docente del curso o un administrador pueden hacer esto.', en: 'Only the course teacher or an administrator can do this.' },
  'curso-incompleto': { es: 'El curso necesita al menos un módulo y un examen.', en: 'The course needs at least one module and an exam.' },
  'curso-con-inscritos': { es: 'El curso tiene alumnos inscritos: despublícalo en vez de eliminarlo.', en: 'The course has enrolled students: unpublish it instead.' },
  'modulo-invalido': { es: 'Los datos del módulo no son válidos.', en: 'The module data is not valid.' },
  'modulo-no-encontrado': { es: 'El módulo no existe.', en: 'The module does not exist.' },
  'enlace-invalido': { es: 'El enlace del video no existe.', en: 'The video link does not exist.' },
  'pregunta-invalida': { es: 'Una pregunta del examen no es válida.', en: 'An exam question is not valid.' },
  'examen-invalido': { es: 'El examen no es válido.', en: 'The exam is not valid.' },
  'examen-no-encontrado': { es: 'El curso aún no tiene examen.', en: 'The course has no exam yet.' },

  // Alumnos
  'curso-no-publicado': { es: 'Este curso no acepta inscripciones.', en: 'This course is not open for enrollment.' },
  'ya-inscrito': { es: 'Ya estás inscrito en este curso.', en: 'You are already enrolled in this course.' },
  'no-inscrito': { es: 'No estás inscrito en este curso.', en: 'You are not enrolled in this course.' },
  'curso-aprobado': { es: 'Ya aprobaste este curso.', en: 'You already passed this course.' },
  'intentos-agotados': { es: 'Ya usaste todos tus intentos.', en: 'You have used all your attempts.' },
  'modulos-pendientes': { es: 'Completa todos los módulos para rendir el examen.', en: 'Complete all modules to take the exam.' },
  'respuesta-invalida': { es: 'Hay respuestas a preguntas que no son de este examen.', en: 'Some answers belong to questions outside this exam.' },
  'intento-invalido': { es: 'El intentoId debe ser un UUID.', en: 'The attemptId must be a UUID.' },
  'certificado-no-encontrado': { es: 'El certificado no existe.', en: 'The certificate does not exist.' },
};

/** Lee Accept-Language ("en-US,en;q=0.9" → "en"). Solo hay español e inglés. */
function elegirIdioma(encabezados = {}) {
  const pedido = encabezados['accept-language'] || encabezados['Accept-Language'] || '';
  return pedido.toLowerCase().startsWith('en') ? 'en' : 'es';
}

function traducir(codigo, idioma, mensajeOriginal) {
  const mensaje = MENSAJES[codigo];
  if (!mensaje) {
    return mensajeOriginal;
  }
  // En español se prefiere el mensaje original, porque trae el detalle (qué id, cuántos módulos faltan...)
  return idioma === 'es' ? mensajeOriginal || mensaje.es : mensaje.en;
}

module.exports = { MENSAJES, elegirIdioma, traducir };
