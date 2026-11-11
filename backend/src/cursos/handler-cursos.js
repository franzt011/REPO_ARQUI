const { crearHandler} = require('../compartido/crear-handler');
const {ok, creado, sinContenido} = require('../compartido/respuestas-http');
const {listarMisCursosDocente } = require('./casos-de-uso/listar-mis-cursos-docente');
const {crearCurso } = require('./casos-de-uso/crear-curso');
const {verCursoDocente} = require('./casos-de-uso/ver-curso-docente');
const {despublicarCurso} = require('./casos-de-uso/despublicar-curso');
const {editarCurso} = require('./casos-de-uso/editar-curso');
const {eliminarCurso} = require('./casos-de-uso/eliminar-curso');
const {eliminarModulo} = require('./casos-de-uso/eliminar-modulo');
const {guardarExamen} = require('./casos-de-uso/guardar-examen');
const {guardarModulo} = require('./casos-de-uso/guardar-modulo');
const {publicarCurso} = require('./casos-de-uso/publicar-curso');
const {verProgresoAlumnos} = require('./casos-de-uso/ver-progreso-alumnos');

const rutas = {
    'GET /gestion/cursos': async (p, d) => ok(await listarMisCursosDocente(d, p.usuarioId)),
    'POST /gestion/cursos': async (p, d) => creado(await crearCurso(d, p.usuarioId, p.cuerpo)),
    'GET /gestion/cursos/{cursoId}': async (p, d) => ok(await verCursoDocente(d, p.usuarioId, p.params.cursoId)),
    'PATH /gestion/cursos/{cursoId}': async (p, d) => ok(await editarCurso(d, p.usuarioId, p.params.cursoId, p.cuerpo)),
    'DELETE /gestion/cursos/{cursoId}': async (p, d) => {
        await eliminarCurso(d, p.usuarioId, p.params.cursoId);
        return sinContenido();
    },

    'POST /gestion/cursos/{cursoId}/modulos': async (p, d) => creado(await guardarModulo(d, p.usuarioId, p.params.cursoId, null, p.cuerpo)),
    'PUT /gestion/cursos/{cursoId}/modulos/{moduloId}': async (p, d) => ok(await guardarModulo(d, p.usuarioId, p.params.cursoId, p.params.moduloId, p.cuerpo)),
    'DELETE /gestion/cursos/{cursoId}/modulos/{moduloId}': async (p, d) => ok(await eliminarModulo(d, p.usuarioId, p.params.cursoId, p.params.moduloId)),
    'PUT /gestion/cursos/{cursoId}/examen': async (p, d) => ok(await guardarExamen(d, p.usuarioId, p.params.cursoId, p.cuerpo.preguntas)),
    'POST /gestion/cursos/{cursoId}/publicar': async (p, d) => ok(await publicarCurso(d, p.usuarioId, p.params.cursoId)),
    'POST /gestion/cursos/{cursoId}/despublicar': async (p, d) => ok(await despublicarCurso(d, p.usuarioId, p.params.cursoId)),
    'GET /gestion/cursos/{cursoId}/progreso': async (p, d) => ok(await verProgresoAlumnos(d, p.usuarioId, p.params.cursoId)),
};

module.exports = {rutas, publicas: [], handler: crearHandler(rutas)};