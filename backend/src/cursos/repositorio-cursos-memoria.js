const { Curso } = require('./curso');

class RepositorioCursosMemoria {
    constructor() {
        this.filas = new Map();
    }

    async guardar(curso) {
        this.filas.set(curso.cursoId, structuredClone(curso.datos()));
    }

    async buscarPorId(cursoId) {
        const fila = this.filas.get(cursoId);
        return fila ? Curso.restaurar(structuredClone(fila)) : undefined;
    }

    async listarPublicados() {
        return this.filtrar((c) => c.estado === 'publicado');
    }

    async listarPorDocente(docenteId) {
        return this.filtrar((c) => c.docenteId === docenteId);
    }

    async listarTodos() {
        return this.filtrar(() => true);
    }

    async eliminar(cursoId) {
        this.filas.delete(cursoId);
    }

    filtrar(condicion) {
        return [...this.filas.values()].filter(condicion).map((fila) => Curso.restaurar(structuredClone(fila)));
    }
}

module.exports = RepositorioCursosMemoria;