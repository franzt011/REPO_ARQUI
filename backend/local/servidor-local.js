/**
 * Servidor para probar la API en tu computador, sin AWS: `npm run local`.
 *
 * Convierte cada petición HTTP al mismo "event" que API Gateway le entrega a
 * Lambda y llama al handler que corresponde. Así se prueba exactamente el mismo
 * código que corre en AWS. Los datos quedan en memoria (se borran al cerrarlo)
 * y el usuario se indica con el encabezado x-usuario-id (admin-1, docente-1, alumno-1).
 */
process.env.AUTH_MODO = process.env.AUTH_MODO || 'desarrollo';
process.env.REPOSITORIOS = process.env.REPOSITORIOS || 'memoria';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { crearDependencias, fijarDependencias } = require('../src/compartido/dependencias');

const PUERTO = Number(process.env.PUERTO || 3000);

/** Busca todos los archivos src/<modulo>/handler-*.js y junta sus rutas. */
function cargarRutas() {
  const rutas = [];
  const carpetaSrc = path.join(__dirname, '..', 'src');
  for (const modulo of fs.readdirSync(carpetaSrc)) {
    const carpeta = path.join(carpetaSrc, modulo);
    if (!fs.statSync(carpeta).isDirectory()) continue;
    for (const archivo of fs.readdirSync(carpeta).filter((a) => /^handler-.*\.js$/.test(a))) {
      const { rutas: rutasDelModulo, handler } = require(path.join(carpeta, archivo));
      for (const routeKey of Object.keys(rutasDelModulo)) {
        const [metodo, plantilla] = routeKey.split(' ');
        // "/cursos/{cursoId}" → /^\/cursos\/(?<cursoId>[^/]+)$/
        const patron = new RegExp(`^${plantilla.replace(/\{(\w+)\}/g, '(?<$1>[^/]+)')}$`);
        rutas.push({ routeKey, metodo, patron, handler, archivo });
      }
    }
  }
  return rutas;
}

function leerCuerpo(pedido) {
  return new Promise((resolver) => {
    let cuerpo = '';
    pedido.on('data', (parte) => (cuerpo += parte));
    pedido.on('end', () => resolver(cuerpo || undefined));
  });
}

async function iniciar() {
  const d = crearDependencias();
  const archivoDatos = path.join(__dirname, 'datos-de-ejemplo.js');
  if (fs.existsSync(archivoDatos)) {
    await require(archivoDatos).cargarDatosDeEjemplo(d);
  }
  fijarDependencias(d);

  const rutas = cargarRutas();

  const servidor = http.createServer(async (pedido, respuesta) => {
    const url = new URL(pedido.url, `http://localhost:${PUERTO}`);
    const ruta = rutas.find((r) => r.metodo === pedido.method && r.patron.test(url.pathname));

    if (!ruta) {
      respuesta.writeHead(404, { 'Content-Type': 'application/json' });
      respuesta.end(JSON.stringify({ codigo: 'ruta-no-encontrada', mensaje: `No existe ${pedido.method} ${url.pathname}` }));
      return;
    }

    const event = {
      routeKey: ruta.routeKey,
      rawPath: url.pathname,
      headers: pedido.headers,
      queryStringParameters: url.searchParams.size > 0 ? Object.fromEntries(url.searchParams) : undefined,
      pathParameters: { ...url.pathname.match(ruta.patron).groups },
      body: await leerCuerpo(pedido),
      requestContext: { http: { method: pedido.method, path: url.pathname } },
    };
    const resultado = await ruta.handler(event);
    respuesta.writeHead(resultado.statusCode, resultado.headers);
    respuesta.end(resultado.body);
  });

  servidor.listen(PUERTO, () => {
    console.log(`API local en http://localhost:${PUERTO} (${rutas.length} rutas)`);
    for (const r of rutas) console.log(`  ${r.routeKey.padEnd(58)} ${r.archivo}`);
  });
}

iniciar();
