const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');

async function verProgresoAlumnos(d, usuarioId, cursoId) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    curso.exigirPuedeGestionar(usuario);

    const progreso = [];
    for (const inscripcion of await d.inscripciones.listarPorCurso(cursoId)) {
        const alumno = await d.usuarios.buscarPorId(inscripcion.alumnoId);
        progreso.push({
            alumnoId: inscripcion.alumnoId,
            nombre: alumno ? alumno.nombre : 'Usuario eliminado',
            estado: inscripcion.estadoVisible(curso.maxIntentos),
            modulosCompletados: inscripcion.modulosCompletados.filter((id) => curso.tieneModulo(id)).length,
            modulosTotales: curso.modulos.length,
            intentosUsados: inscripcion.intentosUsados,
            calificacion: inscripcion.calificacion,
        });
    }
    return progreso.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

module.exports = {verProgresoAlumnos};