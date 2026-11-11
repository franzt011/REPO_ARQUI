const { CircuitBreaker } = require("../compartido/circuit-breaker.js");
const { reintentarConEspera  } = require("../compartido/reintentar-con-espera.js");

function esdeYt(url) {
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

async function consultarServiciodeVideo(url) {
    if (process.env.CHAOS_VIDEOS_CAIDOS === 'si') {
        throw new Error('Servicio de video caído (simulado)');
    }

    const destino = esdeYt(url) ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}` : url;
    const respuesta = await fetch(destino, {
        method: esdeYt(url) ? 'GET': 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(2000),
    });

    if (respuesta.ok) return 'verificado';
    if ([400, 401, 403, 404, 410].includes(respuesta.status)) return 'invalido';
    throw new Error(`El servicio de video respondió ${respuesta.status}`);
}

class VerificadorEnlacesVideo {
    constructor({ consultar = consultarServiciodeVideo, circuito, esperar } = {}) {
        this.consultar = consultar;
        this.circuito = circuito || new CircuitBreaker({ nombre: 'servicio-de-video', umbralFallas: 3, esperaMs: 30000});
        this.esperar = esperar;
    }

    async verificarEnlace(url) {
        return this.circuito.ejecutar(() => reintentarConEspera(() => this.consultar(url), { intentos: 2, esperar: this.esperar }), () => 'pendiente',);
    }
}

let compartido;
function verificadorCompartido() {
    if (!compartido) compartido = new VerificadorEnlacesVideo();
    return compartido;
}

module.exports = { VerificadorEnlacesVideo, verificadorCompartido, consultarServiciodeVideo };