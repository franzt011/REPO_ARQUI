const {test} = require('node:test');
const assert = require('node:assert/strict');
const {CircuitBreaker} = require('../src/compartido/circuit-breaker');
const {reintentarConEspera} = require('../src/compartido/reintentar-con-espera');
const {VerificadorEnlacesVideo} = require('../src/cursos/verificador-enlaces-video');

const sinEsperar = async () => {};
const falla = async () => {
    throw new Error('caído');
};

test('circuit breaker: se abre tras 3 fallas seguidas y deja de llamar al servicio', async (t) => {
    t.mock.method(console, 'log', () => {});
    const circuito = new CircuitBreaker({ umbralFallas: 3, esperaMs: 1000, ahora: () => 0});
    let llamadas = 0;
    const accion = async () => {
        llamadas++;
        throw new Error('caído');
    };

    for (let i = 0; i < 3; i++) await circuito.ejecutar(accion, () => 'alternativa');
    assert.equal(circuito.estado, 'abierto');

    const resultado = await circuito.ejecutar(accion, () => 'alternativa');
    assert.equal(resultado, 'alternativa');
    assert.equal(llamadas, 3, 'con el circuito abierto no se llama al servicio');
});

test('circuit breaker: pasado el tiempo de espera prueba una vez y, si funciona, se cierra', async (t) => {
    t.mock.method(console, 'log', () => {});
    let reloj = 0;
    const circuito = new CircuitBreaker({ umbralFallas: 1, esperaMs: 1000, ahora: () => reloj});
    await circuito.ejecutar(falla, () => null);
    assert.equal(circuito.estado, 'abierto');

    reloj = 1500;
    const resultado = await circuito.ejecutar(async () => 'ok', () => 'alternativa');
    assert.equal(resultado, 'ok');
    assert.equal(circuito.estado, 'cerrado');
});

test('circuit breaker: si la llamada de prueba falla, vuelve a abrirse', async (t) => {
    t.mock.method(console, 'log', () => {});
    let reloj = 0;
    const circuito = new CircuitBreaker({ umbralFallas: 1, esperaMs: 1000, ahora: () => reloj});
    await circuito.ejecutar(falla, () => null);
    reloj = 1500;
    await circuito.ejecutar(falla, () => null);
    assert.equal(circuito.estado, 'abierto');
});

test('reintentos: reintenta hasta que funciona, con esperas que crecen (backoff)', async () => {
    const esperas = [];
    let intentos = 0;
    const resultado = await reintentarConEspera(
        async () => {
            intentos++;
            if (intentos < 3) throw new Error('falla pasajera');
            return 'listo';
        },
        {intentos: 3, esperaBaseMs: 100, esperar: async (ms) => esperas.push(ms), azar: () => 1},
    );
    assert.equal(resultado, 'listo');
    assert.deepEqual(esperas, [100, 200]);
});

test('reintentos: si se acaban los intentos, lanza el último error', async () => {
    await assert.rejects(reintentarConEspera(falla, {intentos: 2, esperar: sinEsperar}), /caído/);
});

test('verificador de videos: si el servicio está caído responde "pendiente" en vez de fallar', async (t) => {
    t.mock.method(console, 'log', () => {});
    const verificador = new VerificadorEnlacesVideo({ consultar: falla, esperar: sinEsperar});
    assert.equal(await verificador.verificarEnlace('https://youtu.be/x'), 'pendiente');
});

test('verificador de videos: un video que no existe es "invalido" y no cuenta como una falla del servicio', async () => {
    const verificador = new VerificadorEnlacesVideo({ consultar: async () => 'invalido', esperar: sinEsperar});
    assert.equal(await verificador.verificarEnlace('https://youtu.be/x'), 'invalido');
    assert.equal(verificador.circuito.fallasSeguidas, 0);
});