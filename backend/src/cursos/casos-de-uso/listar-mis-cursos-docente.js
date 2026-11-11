const { exigirUsuario } = require('../../compartido/buscar-o-fallar');

async function listarMisCursosDocente(d, usuarioId) {
    const usuario = await exigirUsuario(d, usuarioId, ['docente', 'admin']);
    const cursos = usuario.rol === 'admin' ? await d.cursos.listarTodos(): await d.cursos.listarPorDocente(usuarioId);
    return cursos.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)).map((c) => c.datos());
}

module.exports = { listarMisCursosDocente };