const { exigirUsuario, exigirCurso } = require('../../compartido/buscar-o-fallar');
const { NoEncontradoError, ReglaDeNegocioError } = require('../../compartido/errores');
const { Modulo } = require('../curso');

async function guardarModulo(d, usuarioId, cursoId, moduloId, {titulo, contenido, duracion, linkVideo}) {
    const usuario = await exigirUsuario(d, usuarioId);
    const curso = await exigirCurso(d, cursoId);
    curso.exigirPuedeGestionar(usuario);
    
    const anterior = moduloId ? curso.buscarModulo(moduloId) : undefined;
    if (moduloId && !anterior) {
        throw new NoEncontradoError('modulo-no-encontrado', `El curso no tiene el módulo ${moduloId}.`);
    }

    const modulo = new Modulo({ moduloId: moduloId || d.ids.nuevo(), titulo, contenido, duracion, linkVideo});

    if (modulo.linkVideo) {
        const yaVerificado = anterior?.linkVideo === modulo.linkVideo && anterior.estadoEnlace === 'verificado';
        const estado = yaVerificado ? 'verificado' : await d.videos.verificarEnlace(modulo.linkVideo);
        if (estado === 'invalido') {
            throw new ReglaDeNegocioError('enlace-valido', 'El enlace del video no existe o no es publico.');
        }
        modulo.estadoEnlace = estado;
    }

    curso.guardarModulo(usuario, modulo);
    await d.cursos.guardar(curso);
    return curso.datos();
}

module.exports = { guardarModulo};