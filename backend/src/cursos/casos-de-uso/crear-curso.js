const { exigirUsuario } = require('../../compartido/buscar-o-fallar');
const { Curso } = require('../curso');

async function crearCurso(d, usuarioId, { titulo, descripcion, exigenciaMinima, maxIntentos }) {
    await exigirUsuario(d, usuarioId, ['docente', 'admin']);
    const curso = Curso.crear({
        cursoId: d.ids.nuevo(),
        docenteId: usuarioId,
        titulo,
        descripcion,
        exigenciaMinima,
        maxIntentos,
        fechaCreacion: d.reloj.ahora().toISOString(),
    });
    await d.cursos.guardar(curso);
    return curso.datos();
}

module.exports = { crearCurso };
