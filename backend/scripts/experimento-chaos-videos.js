const {CircuitBreaker} = require('../src/compartido/circuit-breaker');
const {VerificadorEnlacesVideo} = require('../src/cursos/verificador-enlaces-video');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let servicioCaido = false;

async function servicioDeVideoSimulado() {
    if (servicioCaido) {
        await esperar(1500);
        throw new Error('timeout');
    }
    await esperar(80);
    return 'verificado';
}

const circuito = new CircuitBreaker({ nombre: 'servicios-de-video', umbralFallas: 3, esperaMs: 3000});
const verificador = new VerificadorEnlacesVideo({ consultar: servicioDeVideoSimulado, circuito, esperar: () => esperar(50)});

async function guardarModulo(numero) {
    const inicio = Date.now();
    const estadoEnlace = await verificador.verificarEnlace('https://youtu.be/video');
    const ms = Date.now() - inicio;
    console.log(` módulo ${String(numero).padStart(2)} => enlace ${estadoEnlace.padEnd(10)} ${String(ms).padStart(5)} ms circuito: ${circuito.estado}`);
}

async function main() {
    console.log = ((original) => (...args) => {
        if (typeof args[0] === 'string' && args[0].startsWith('{"circuito"')) return;
        original(...args);
    })(console.log);

    let n = 1;
    console.log('\n1) Estado estable: el servicio de video funciona');
    for (let i = 0; i < 2; i++) await guardarModulo(n++);
    
    console.log('\n2) Se inyecta la falla: el servicio de video se cae');
    servicioCaido = true;
    for (let i = 0; i < 6; i++) await guardarModulo(n++);
    console.log('  => tras 3 fallas el circuito se abre y las respuestas vuelven a ser inmediatas');

    console.log('\n3) Recuperación: el servicio vuelve; se espera que pase el tiempo del circuito (3 s)');
    servicioCaido = false;
    await esperar(3100);
     for (let i = 0; i < 2; i++) await guardarModulo(n++);
     console.log('  => la llamada de prueba (semiabierto) funciona y el circuito se cierra\n');
}

main();