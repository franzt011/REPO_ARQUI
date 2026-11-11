const {test, beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const {crearDependencias} = require('../src/compartido/dependencias');
const {Usuario} = require('../src/usuarios/usuario');
const {Examen, Pregunta} = require('../src/cursos/examen');
const {crearCurso} = require('../src/cursos/casos-de-uso/crear-curso');
const {editarCurso} = require('../src/cursos/casos-de-uso/editar-curso');
const {guardarModulo} = require('../src/cursos/casos-de-uso/guardar-modulo');
const {guardarExamen} = require('../src/cursos/casos-de-uso/guardar-examen');
const {publicarCurso} = require('../src/cursos/casos-de-uso/publicar-curso');
const {eliminarCurso} = require('../src/cursos/casos-de-uso/eliminar-curso');
const {listarMisCursosDocente} = require('../src/cursos/casos-de-uso/listar-mis-cursos-docente');

let d;
let estadoVideo;
let inscritos;

beforeEach(async () => {
    let numero = 0;
    estadoVideo = 'verificado';
    inscritos = [];
    d = crearDependencias({
        modo: 'memoria',
        reemplazos: {
            ids: { nuevo: () => `id-${++numero}` },
            reloj: { ahora: () => new Date('2026-11-06T12:00:00Z')},
            videos: { verificarEnlace: async () => estadoVideo},
            inscripciones: { listarPorCurso: async () => inscritos}
        },
    });
    for (const [usuarioId, rol] of [
        ['docente-1', 'docente'],
        ['docente-2', 'docente'],
        ['alumno-1', 'alumno'],
    ]) {
        await d.usuarios.guardar(Usuario.crear({ usuarioId, rol, nombre: usuarioId, correo: `${usuarioId}@alumco.cl`}));
    }
});

const nuevoCurso = () => crearCurso(d, 'docente-1', { titulo: 'Primeros auxilios', descripcion: 'Basico'});
const preguntaVf = {tipo: 'vf', texto: 'El agua moja?', respuestaVf: true};

test('un curso nuevo nace en borrador con los valores por defecto', async () => {
    const curso = await nuevoCurso();
    assert.equal(curso.estado, 'borrador');
    assert.equal(curso.exigenciaMinima, 60);
    assert.equal(curso.maxIntentos, 2);
});

test('un alumno no puede crear cursos', async () => {
    await assert.rejects(crearCurso(d, 'alumno-1', {titulo: 'X'}), {codigo: 'rol-no-permitido'});
});

test('un curso sin titulo se rechaza', async () => {
    await assert.rejects(crearCurso(d, 'docente-1', {titulo: ' '}), {codigo: 'curso-invalido'});
});

test('otro docente no puede editar el curso', async () => {
    const curso = await nuevoCurso();
    await assert.rejects(editarCurso(d, 'docente-2', curso.cursoId, {titulo: 'Mio'}), {codigo: 'sin-permiso-curso'});
});

test('la exigencia minima debe ser entre 1 y 100', async () => {
    const curso = await nuevoCurso();
    await assert.rejects(editarCurso(d, 'docente-1', curso.cursoId, {exigenciaMinima: 150}), {codigo: 'curso-invalido'});
});

test('no se publica un curso sin modulos o sin examen', async () => {
    const curso = await nuevoCurso();
    await assert.rejects(publicarCurso(d, 'docente-1', curso.cursoId), {codigo: 'curso-incompleto'});
    await guardarModulo(d, 'docente-1', curso.cursoId, null, { titulo: 'Modulo 1'});
    await assert.rejects(publicarCurso(d, 'docente-1', curso.cursoId), {codigo: 'curso-incompleto'});
    await guardarExamen(d, 'docente-1', curso.cursoId, [preguntaVf]);
    const publicado = await publicarCurso(d, 'docente-1', curso.cursoId);
    assert.equal(publicado.estado, 'publicado');
});

test('un módulo con video se guarda verificado si el servicio responde', async () => {
    const curso = await nuevoCurso();
    const resultado = await guardarModulo(d, 'docente-1', curso.cursoId, null, { titulo: 'Video', linkVideo: 'https://youtu.be/abc'});
    assert.equal(resultado.modulos[0].estadoEnlace, 'verificado');
});

test('si el servicio de video no responde, el modulo se guarda igual como "pendiente"', async () => {
    estadoVideo = 'pendiente';
    const curso = await nuevoCurso();
    const resultado = await guardarModulo(d, 'docente-1', curso.cursoId, null, { titulo: 'Video', linkVideo: 'https://youtu.be/abc'});
    assert.equal(resultado.modulos[0].estadoEnlace, 'pendiente');
});

test('un video que no existe se rechaza', async () => {
    estadoVideo = 'invalido';
    const curso = await nuevoCurso();
    await assert.rejects(guardarModulo(d, 'docente-1', curso.cursoId, null, {titulo: 'Video', linkVideo: 'https://youtu.be/x'}), {codigo: 'enlace-invalido',});
});

test('una pregunta de seleccion multiple necesita exactamente una opcion correcta', async () => {
    const curso = await nuevoCurso();
    const mala = { tipo: 'multiple', texto: 'Cual?', opciones: [{ texto: 'A', esCorrecta: true}, { texto: 'B', esCorrecta: true}] };
    await assert.rejects(guardarExamen(d, 'docente-1', curso.cursoId, [mala]), { codigo: 'pregunta-invalida'});
});

test('no se elimina un curso con alumnos inscritos', async () => {
    const curso = await nuevoCurso();
    inscritos = [{ alumnoId: 'alumno-1'}];
    await assert.rejects(eliminarCurso(d, 'docente-1', curso.cursoId), {codigo: 'curso-con-inscritos'});
});

test('cada docente ve solo sus cursos', async () => {
    await nuevoCurso();
    await crearCurso(d, 'docente-2', {titulo: 'Otro'});
    const cursos = await listarMisCursosDocente(d, 'docente-1');
    assert.deepEqual(cursos.map((c) => c.titulo), ['Primeros auxilios'],);
});

test('calificar: se redondea el porcentaje y una pregunta sin responder cuenta como incorrecta', () => {
    const examen = new Examen('c', [
        new Pregunta({ preguntaId: 'p1', tipo: 'vf', texto: 'a', respuestaVf: true}),
        new Pregunta({ preguntaId: 'p2', tipo: 'vf', texto: 'b', respuestaVf: false}),
        new Pregunta({ preguntaId: 'p3', tipo: 'vf', texto: 'c', respuestaVf: true}),
    ]);
    const resultado = examen.calificar(
        [
            { preguntaId: 'p1', respuesta: 'verdadero'},
            { preguntaId: 'p2', respuesta: 'falso'},
        ],
        60,
    );
    assert.deepEqual(resultado, { correctas: 2, total: 3, porcentaje: 67, aprobado: true});
});