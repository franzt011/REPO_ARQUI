const { ReglaDeNegocioError, esTextoConContenido } = require('../compartido/errores');

function invalida(mensaje) {
    return new ReglaDeNegocioError('pregunta-invalida', mensaje);
}

class Pregunta {
    constructor(datos) {
        if (!esTextoConContenido(datos.texto)) {
            throw invalida('La pregunta necesita un enunciado.');
        }
        if (datos.tipo === 'multiple') {
            const opciones = (datos.opciones || []).filter((o) => esTextoConContenido(o.texto));
            if (opciones.length < 2) {
                throw invalida('Una pregunta de selección múltiple necesita al menos 2 opciones.');
            }
            if (opciones.filter((o) => o.esCorrecta === true).length !== 1) {
                throw invalida('Una pregunta de selección múltiple necesita exactamente 1 opción correcta.');
            }
            this.opciones = opciones.map((o) => ({ opcionId: o.opcionId, texto: o.texto, esCorrecta: o.esCorrecta === true}));
        } else if (datos.tipo === 'vf') {
            if (typeof datos.respuestaVf !== 'boolean') {
                throw invalida('Una pregunta de V/F necesita su respuesta correcta.');
            }
            this.opciones = [];
            this.respuestaVf = datos.respuestaVf;
        } else {
            throw invalida(`El tipo de pregunta "${datos.tipo}" no existe. Usa "multiple" o "vf".`);
        }
        this.preguntaId = datos.preguntaId;
        this.tipo = datos.tipo;
        this.texto = datos.texto;
    }

    esCorrecta(respuesta) {
        if (this.tipo === 'multiple') {
            return this.opciones.some((o) => o.opcionId === respuesta && o.esCorrecta);
        }
        return (respuesta === 'verdadero') === this.respuestaVf;
    }

    datos() {
        return {
            preguntaId: this.preguntaId,
            tipo: this.tipo,
            texto: this.texto,
            opciones: this.opciones.map((o) => ({ ...o })),
            respuestaVf: this.respuestaVf,
        };
    }

    vistaAlumno() {
        return {
            preguntaId: this.preguntaId,
            tipo: this.tipo,
            texto: this.texto,
            opciones: this.tipo === 'multiple' ? this.opciones.map((o) => ({ opcionId: o.opcionId, texto: o.texto }))
            : [
                {opcionId: 'verdadero', texto: 'Verdadero'},
                {opcionId: 'falso', texto: 'Falso'},
            ],
        };
    }
}

class Examen {
    constructor(cursoId, preguntas) {
        const ids = new Set(preguntas.map((p) => p.preguntaId));
        if (ids.size !== preguntas.length) {
            throw new ReglaDeNegocioError('examen-invalido', 'Hay preguntas con el mismo id.');
        }
        this.cursoId = cursoId;
        this.preguntas = preguntas;
    }

    static restaurar(datos) {
        return new Examen(
            datos.cursoId,
            datos.preguntas.map((p) => new Pregunta(p)),
        );
    }

    datos() {
        return { cursoId: this.cursoId, preguntas: this.preguntas.map((p) => p.datos()) };
    }

    get cantidadPreguntas() {
        return this.preguntas.length;
    }

    vistaAlumno() {
        return this.preguntas.map((p) => p.vistaAlumno());
    }

    calificar(respuestas, exigenciaMinima) {
        if (this.preguntas.length === 0) {
            throw new ReglaDeNegocioError('examen-invalido', 'El examen no tiene preguntas.');
        }
        const porPregunta = new Map((respuestas || []).map((r) => [r.preguntaId, r.respuesta]));
        for (const preguntaId of porPregunta.keys()) {
            if (!this.preguntas.some((p) => p.preguntaId === preguntaId)) {
                throw new ReglaDeNegocioError('respuesta-invalida', `La pregunta ${preguntaId} no pertenece a este examen.`);
            }
        }

        const correctas = this.preguntas.filter((p) => {
            const respuesta = porPregunta.get(p.preguntaId);
            return respuesta !== undefined && p.esCorrecta(respuesta);
        }).length;
        const total = this.preguntas.length;
        const porcentaje = Math.round((correctas / total) * 100);
        return { correctas, total, porcentaje, aprobado: porcentaje >= exigenciaMinima };
    }
}

module.exports = {Examen, Pregunta };