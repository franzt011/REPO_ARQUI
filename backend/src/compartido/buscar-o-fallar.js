/**
 * Búsquedas que repiten muchos casos de uso: si lo buscado no existe (o el
 * usuario no tiene el rol pedido), lanzan el error correspondiente.
 */
const { NoEncontradoError, SinPermisoError } = require('./errores');

/**
 * El usuario que hace la petición. Su id viene del token, pero el ROL se lee de
 * la tabla Usuarios, porque el administrador puede cambiarlo.
 * @param roles  lista de roles permitidos; si no se indica, sirve cualquiera
 */
async function exigirUsuario(d, usuarioId, roles) {
  const usuario = await d.usuarios.buscarPorId(usuarioId);
  if (!usuario) {
    throw new NoEncontradoError('perfil-no-encontrado', 'Tu cuenta no tiene perfil.');
  }
  if (!usuario.activo) {
    throw new SinPermisoError('usuario-inactivo', 'Tu cuenta está desactivada.');
  }
  if (roles && !roles.includes(usuario.rol)) {
    throw new SinPermisoError('rol-no-permitido', `Esta acción es solo para: ${roles.join(', ')}.`);
  }
  return usuario;
}

async function exigirCurso(d, cursoId) {
  const curso = await d.cursos.buscarPorId(cursoId);
  if (!curso) {
    throw new NoEncontradoError('curso-no-encontrado', `No existe el curso ${cursoId}.`);
  }
  return curso;
}

async function exigirInscripcion(d, alumnoId, cursoId) {
  const inscripcion = await d.inscripciones.buscar(alumnoId, cursoId);
  if (!inscripcion) {
    throw new NoEncontradoError('no-inscrito', 'No estás inscrito en este curso.');
  }
  return inscripcion;
}

module.exports = { exigirUsuario, exigirCurso, exigirInscripcion };
