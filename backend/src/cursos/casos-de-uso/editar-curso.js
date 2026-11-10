const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');

async function editarCurso(d, usuarioId, cursoId, { titulo, descripcion, exigenciaMinima, maxIntentos }) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    curso.editar(usuario, { titulo, descripcion, exigenciaMinima, maxIntentos });
    await d.curso.guardar(curso);
    return curso.datos();
}

module.exports = { editarCurso };