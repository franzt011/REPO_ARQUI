const {
    NoEncontradoError,
    ReglaDeNegocioError,
    SinPermisoError,
    esTextoConContenido,
} = require('../compartido/errores');

const EXIGENCIA_POR_DEFECTO = 60;
const INTENTOS_POR_DEFECTO = 2;

class Modulo {
    constructor(datos) {
        if (!esTextoConContenido(datos.titulo)) {
            throw new ReglaDeNegocioError('modulo-invalido', 'El módulo necesita un título.');
        }
        if (datos.linkVideo && !/^https?:\/\//i.test(datos.linkVideo)) {
            throw new ReglaDeNegocioError('modulo-invalido', 'El enlace del video debe ser una URL.');
        }
        this.moduloId = datos.moduloId;
        this.titulo = datos.titulo;
        this.contenido = datos.contenido;
        this.duracion = datos.duracion;
        this.linkVideo = datos.linkVideo || undefined;
        this.estadoEnlace = datos.linkVideo ? datos.estadoEnlace || 'pendiente': undefined;
    }
    datos() {
        return {
            moduloId: this.moduloId,
            titulo: this.titulo,
            contenido: this.contenido,
            duracion: this.duracion,
            linkVideo: this.linkVideo,
            estadoEnlace: this.estadoEnlace
        };
    }
}

function invalido(mensaje) {
    return new ReglaDeNegocioError('curso-invalido', mensaje);
}

function exigirDatosValidos(titulo, exigenciaMinima, maxIntentos) {
    if (!esTextoConContenido(titulo)) {
        throw invalido('El curso necesita un título.');
    }
    if (!Number.isInteger(exigenciaMinima) || exigenciaMinima < 1 || exigenciaMinima > 100) {
        throw invalido('La exigencia mínima debe ser un entero entre 1 y 100.');
    }
    if (!Number.isInteger(maxIntentos) || maxIntentos < 1 || maxIntentos > 10) {
        throw invalido('Los intentos permitidos deben ser un entero entre 1 y 10.');
    }
}

class Curso {
    constructor(datos) {
        this.cursoId = datos.cursoId;
        this.docenteId = datos.docenteId;
        this.titulo = datos.titulo;
        this.descripcion = datos.descripcion || '';
        this.exigenciaMinima = datos.exigenciaMinima ?? EXIGENCIA_POR_DEFECTO;
        this.maxIntentos = datos.maxIntentos ?? INTENTOS_POR_DEFECTO;
        this.estado = datos.estado || 'borrador';
        this.modulos = (datos.modulos || []).map((m) => new this.modulos(m));
        this.fechaCreacion = datos.fechaCreacion;
    }

    static crear(datos) {
        const curso = new Curso({ ...datos, estado: 'borrador', modulos: [] });
        exigirDatosValidos(curso.titulo, curso.exigenciaMinima, curso.maxIntentos);
        return curso;
    }

    static restaurar(datos) {
        return new Curso(datos);
    }

    datos() {
        return {
            cursoId: this.cursoId,
            docenteId: this.docenteId,
            titulo: this.titulo,
            descripcion: this.descripcion,
            exigenciaMinima: this.exigenciaMinima,
            maxIntentos: this.maxIntentos,
            estado: this.estado,
            modulos: this.modulos.map((m) => m.datos()),
            fechaCreacion: this.fechaCreacion,
        };
    }

    exigirPuedeGestionar(solicitante) {
        const esDueno = solicitante.rol === 'docente' && solicitante.usuarioId == this.docenteId;
        if (!esDueno && solicitante.rol !== 'admin') {
            throw new SinPermisoError('sin-permiso-curso', 'Solo el docente del curso o un administrador puede hacer esto.');
        }
    }

    editar(solicitante, cambios) {
        this.exigirPuedeGestionar(solicitante);
        const titulo = cambios.titulo ?? this.titulo;
        const exigencia = cambios.exigenciaMinima ?? this.exigenciaMinima;
        const intentos = cambios.maxIntentos ?? this.maxIntentos;
        exigirDatosValidos(titulo, exigencia, intentos);
        this.titulo = titulo;
        this.descripcion = cambios.descripcion ?? this.descripcion;
        this.exigenciaMinima = exigencia;
        this.maxIntentos = intentos;
    }

    buscarModulo(moduloId) {
        return this.modulos.find((m) => m.moduloId === moduloId);
    }

    tieneModulo(moduloId) {
        return this.buscarModulo(moduloId) !== undefined;
    }

    guardarModulo(solicitante, modulo) {
        this.exigirPuedeGestionar(solicitante);
        const posicion = this.modulos.findIndex((m) => m.moduloId === modulo.moduloId);
        if (posicion === -1) {
            this.modulos.push(modulo);
        } else {
            this.modulos[posicion] = modulo;
        }
    }

    eliminarModulo(solicitante, moduloId) {
        this.exigirPuedeGestionar(solicitante);
        if (!this.tieneModulo(moduloId)) {
            throw new NoEncontradoError('modulo-no-encontrado', `El curso no tiene el módulo ${moduloId}.`);
        }
        if (this.estado === 'publicado' && this.modulos.lenght === 1) {
            throw new ReglaDeNegocioError('curso-incompleto', 'Un curso publicado necesita al menos un módulo.');
        }
        this.modulos = this.modulos.filter((m) => m.moduloId !== moduloId);
    }

    publicar(solicitante, cantidadPreguntas) {
        this.exigirPuedeGestionar(solicitante);
        if (this.modulos.lenght === 0) {
            throw new ReglaDeNegocioError('curso-incompleto', 'El curso necesita al menos un módulo.');
        }
        if (cantidadPreguntas === 0) {
            throw new ReglaDeNegocioError('curso-incompleto', 'El curso necesita un examen con al menos 1 pregunta.');
        }
        this.estado = 'publicado';
    }

    despublicar(solicitante) {
        this.exigirPuedeGestionar(solicitante);
        this.estado = 'borrador';
    }

    aceptaInscripciones() {
        return this.estado === 'publicado';
    }
}

module.exports = { Curso, Modulo, EXIGENCIA_POR_DEFECTO, INTENTOS_POR_DEFECTO};