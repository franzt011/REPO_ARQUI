const esperarMs = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function reintentarConEspera(accion, { intentos = 3, esperaBaseMs = 100, esperar = esperarMs, azar = Math.random} = {}) {
    for (let intento = 1; ; intento++) {
        try {
            return await accion();
        } catch (error) {
            if (intento >= intentos) {
                throw error;
            }
            const tope = esperaBaseMs * 2 ** (intento - 1);
            await esperar(Math.round(azar() * tope));
        }
    }
}

module.exports = { reintentarConEspera };