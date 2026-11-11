const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');
const { DatosInvalidosError, ReglaDeNegocioError  } = require('../../compartido/errores');
const { Examen, Pregunta } = require('../examen');

async function guardarExamen(d, usuarioId, cursoId, preguntas) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    curso.exigirPuedeGestionar(usuario);
    if (!Array.isArray(preguntas)) {
        throw new DatosInvalidosError('examen-invalido', 'Envía preguntas como una lista.');
    }

    const examen = new Examen(
        cursoId,
        preguntas.map((p) => new Pregunta({
            tipo: p.tipo,
            texto: p.texto,
            respuestaVf: p.respuestaVf,
            preguntaId: d.ids.nuevo(),
            opciones: (p.opciones || []).map((o) => ({
                texto:o.texto,
                esCorrecta:o.esCorrecta,
                opcionId: d.ids.nuevo()
            })),
        }),),
    );

    if (curso.estado === 'publicado' && examen.cantidadPreguntas === 0) {
        throw new ReglaDeNegocioError('curso-incompleto', 'Un curso publicado necesita al menos una pregunta.');
    }
    await d.examenes.guardar(examen);
    return examen.datos().preguntas;
}

module.exports = { guardarExamen};