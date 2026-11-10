const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');

async function verCursoDocente(d, usuarioId, cursoId) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    curso.exigirPuedeGestionar(usuario);
    const [examen, inscripciones] = await Promise.all([
        d.examenes.buscarPorCurso(cursoId),
        d.inscripciones.listarPorCurso(cursoId),
    ]);
    return {
        curso: curso.datos(),
        preguntas: examen ? examen.datos().preguntas : [],
        inscritos: inscripciones.length,
    };
}

module.exports = { verCursoDocente };