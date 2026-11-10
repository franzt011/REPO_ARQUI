const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');
const { ConflictoError } = require('../../compartido/errores');

async function eliminarCurso(d, usuarioId, cursoId) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    curso.exigirPuedeGestionar(usuario);

    const inscripciones = await d.inscripciones.listarPorCurso(cursoId);
    if (inscripciones.length > 0) {
        throw new ConflictoError('curso-con-inscritos', 'El curso tiene alumnos inscritos: se despublica en vez de eliminar.');
    }
    await d.cursos.eliminar(cursoId);
    await d.examenes.elimar(cursoId);
}

module.exports = { eliminarCurso};