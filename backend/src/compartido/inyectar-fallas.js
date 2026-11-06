/**
 * Chaos Engineering: inyecta fallas y latencia a propósito, controladas por
 * variables de entorno. Con las variables en 0 (o sin definir) no hace nada.
 *
 *   CHAOS_TASA_FALLAS=0.3    → 30% de las peticiones responden 500
 *   CHAOS_LATENCIA_MS=400    → cada petición tarda 400 ms más
 *
 * Es la misma idea del Lab Canary del ramo (FAIL_RATE y EXTRA_LATENCY_MS):
 * scripts/canario.sh publica una versión "mala" con estas variables para
 * mostrar que el canario detecta el deterioro y se puede revertir.
 */
const { ErrorDeNegocio } = require('./errores');

class FallaSimuladaError extends ErrorDeNegocio {}

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function inyectarFallas(azar = Math.random) {
  const latenciaMs = Number(process.env.CHAOS_LATENCIA_MS || 0);
  const tasaFallas = Number(process.env.CHAOS_TASA_FALLAS || 0);

  if (latenciaMs > 0) {
    await esperar(latenciaMs);
  }
  if (azar() < tasaFallas) {
    throw new FallaSimuladaError('error-simulado', 'Falla simulada (chaos).');
  }
}

module.exports = { inyectarFallas, FallaSimuladaError };
