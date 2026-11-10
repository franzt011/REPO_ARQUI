const { Examen } = require('./examen');

class RepositorioExamenesMemoria {
    constructor() {
        this.filas = new Map();
    }

    async guardar(examen) {
        this.filas.set(examen.cursoId, structuredClone(examen.datos()));
    }

    async buscarPorCurso(cursoId) {
        const fila = this.filas.get(cursoId);
        return fila ? Examen.restaurar(structuredClone(fila)) : undefined;
    }

    async eliminar(cursoId) {
        this.filas.delete(cursoId);
    }
}

module.exports = RepositorioExamenesMemoria;