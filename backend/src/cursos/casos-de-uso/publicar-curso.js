const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');

async function publicarCurso(d, usuarioId, cursoId) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    const examen = await d.examenes.buscarPorCurso(cursoId);
    curso.publicar(usuario, examen ? examen.cantidadPreguntas : 0);
    await d.cursos.guardar(curso);
    return curso.datos();
}

module.exports = { publicarCurso};