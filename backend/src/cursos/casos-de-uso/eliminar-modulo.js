const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');

async function eliminarModulo(d, usuarioId, cursoId, moduloId) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    curso.eliminarModulo(usuario, moduloId);
    await d.cursos.guardar(curso);
    return curso.datos();
}

module.exports = { eliminarModulo };