const {Usuario} = require('../src/usuarios/usuario');
const {Curso, Modulo} = require('../src/cursos/curso');
const {Examen, Pregunta} = require('../src/cursos/examen');

const CONTRASENA = 'Alumco-2026';

async function cargarDatosDeEjemplo(d) {
    const fecha = '2026-11-01T12:00:00.000Z';
    const usuarios = [
        {usuarioId: 'admin-1', nombre: 'Administración Alumco', correo: 'admin@alumco.cl', rol: 'admin', sede: 'Hualpen'},
        {usuarioId: 'docente-1', nombre: 'Carla Rojas', correo: 'carla@alumco.cl', rol: 'docente', sede: 'Concepcion'},
        {usuarioId: 'alumno-1', nombre: 'Diego Muñoz', correo: 'diego@alumco.cl', rol: 'alumno', sede: 'Hualpen'},
    ];
    for (const datos of usuarios) {
        await d.usuarios.guardar(Usuario.crear({ ...datos, fechaCreacion: fecha }));
        d.cuentas.cuentas.set(datos.correo, { usuarioId: datos.usuarioId, contrasena: CONTRASENA, activo: true});
    }

    const docente = await d.usuarios.buscarPorId('docente-1');
    const curso = Curso.crear({
        cursoId: 'curso-1',
        docenteId: 'docente-1',
        titulo: 'Prevención de caídad en adultos mayores',
        descripcion: 'Como reconocer riesgos y movilizar a un residente de forma segura.',
        exigenciaMinima: 60,
        maxIntentos: 2,
        fechaCreacion: fecha,
    });
    curso.guardarModulo(
        docente,
        new Modulo({ moduloId: 'mod-1', titulo: 'Factores de riesgo.', contenido: 'Medicamentos, calzado, iluminacion y superficies.', duracion: '15 min'}),
    );
    curso.guardarModulo(
        docente,
        new Modulo({ moduloId: 'mod-2', titulo: 'Movilizacion segura', contenido: 'Tecnicas para levantar y trasladar.', duracion: '20 min', linkVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', estadoEnlace: 'verificado' }),
    );

    const examen = new Examen('curso-1', [
        new Pregunta({ preguntaId: 'p1', tipo: 'vf', texto: 'Una buena iluminacion reduce el riesgo de caidas.', respuestaVf: true}),
        new Pregunta({ preguntaId: 'p2', tipo: 'multiple', texto: 'Qué calzado es el más seguro?', opciones: [
            {opcionId: 'p2-a', texto: 'Pantuflas abiertas', esCorrecta: false},
            {opcionId: 'p2-b', texto: 'Zapato cerrado con suela antideslizante', esCorrecta: true},
            {opcionId: 'p2-c', texto: 'Calcetines', esCorrecta: false},
        ],}),
    ]);
    await d.examenes.guardar(examen);
    curso.publicar(docente, examen.cantidadPreguntas);
    await d.cursos.guardar(curso);
}

module.exports = {cargarDatosDeEjemplo, CONTRASENA};