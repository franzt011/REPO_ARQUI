const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');

async function despublicarCurso(d, usuarioId, cursoId) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    curso.despublicar(usuario);
    await d.cursos.guardar(curso);
    return curso.datos();    
}

module.exports = { despublicarCurso};