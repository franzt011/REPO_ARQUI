const esperarMs = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function retrybackoffJitter(accion, { intentos = 3, esperabaseMs = 100, esperar = esperarMs, azar = Math.random} = {}) {
    for (let intento = 1; ; intento++) {
        try {
            return await accion();
        } catch (error) {
            if (intento >= intentos) {
                throw error;
            }
            const tope = esperabaseMs * 2 ** (intento - 1);
            await esperar(Math.round(azar() * tope));
        }
    }
}

module.exports = { retrybackoffJitter };