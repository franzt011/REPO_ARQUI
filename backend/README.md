# Alumco · Backend (JavaScript + AWS serverless)

Backend de la plataforma de capacitación de Alumco, una ONG que administra un ELEAM.
Hay tres roles: **admin** (gestiona cuentas), **docente** (crea cursos, módulos y exámenes) y **alumno** (se inscribe, estudia, rinde el examen y obtiene un certificado verificable).

Proyecto del ramo Arquitectura de Sistemas (UDD), hecho por Francisca Zepeda y Vicente [apellido].

## Arquitectura

```
Cliente ──HTTPS──▶ API Gateway (HTTP API) ──▶ Lambda salud | usuarios | cursos | alumnos ──▶ DynamoDB (6 tablas)
                      │ valida el token JWT                         │
                      ▼                                             └─▶ YouTube / Drive (con Circuit Breaker)
                   Cognito (cuentas y contraseñas)
```

- **Serverless:** 4 Lambdas (una por módulo de negocio), API Gateway, DynamoDB on-demand y Cognito. No hay servidores que administrar. Todo está declarado en `serverless.yml` (infraestructura como código).
- **Clean Architecture:** cada módulo separa sus **entidades** (reglas de negocio), sus **casos de uso** (un archivo por acción), sus **repositorios** (DynamoDB o memoria) y su **handler** (HTTP). Las entidades y los casos de uso no conocen AWS ni HTTP.

```
src/
  compartido/   lo que usan todos: errores, respuestas HTTP, auth, i18n, inyección de dependencias,
                circuit breaker, reintentos y chaos
  salud/        GET /salud
  usuarios/     login, perfil y administración de cuentas (Cognito)
  cursos/       gestión de cursos, módulos y exámenes (docente)
  alumnos/      catálogo, inscripción, examen y certificados
local/          servidor para probar en tu computador, más datos de ejemplo
scripts/        canario, generador de carga, crear el primer admin, experimento de chaos
pruebas/        pruebas automáticas (node --test)
demo/           colección de Postman
```

Dentro de cada módulo, el nombre del archivo dice lo que hace:

| Busco… | Archivo |
|---|---|
| Las rutas de un módulo | `src/<modulo>/handler-<modulo>.js` (y `serverless.yml`) |
| El try/catch (cómo un error se vuelve 404, 403…) | `src/compartido/crear-handler.js` |
| Una regla de negocio | la entidad: `curso.js`, `examen.js`, `inscripcion.js`, `usuario.js` |
| Lo que hace un endpoint | `src/<modulo>/casos-de-uso/<accion>.js`, p. ej. `rendir-examen.js` |
| Dónde se elige DynamoDB o memoria | `src/compartido/dependencias.js` |
| Las consultas a DynamoDB | `src/<modulo>/repositorio-*-dynamo.js` |

## Patrones de diseño y dónde están

| Patrón | Para qué | Archivo |
|---|---|---|
| Repositorio | La lógica no depende de DynamoDB | `repositorio-*-dynamo.js` / `repositorio-*-memoria.js` |
| Inyección de dependencias | Cambiar DynamoDB por memoria sin tocar los casos de uso | `compartido/dependencias.js` |
| Circuit Breaker | No quedar esperando a YouTube o Drive si están caídos | `compartido/circuit-breaker.js`, `cursos/verificador-enlaces-video.js` |
| Retry + backoff + jitter | Reintentar fallas pasajeras sin saturar | `compartido/reintentar-con-espera.js` |
| Idempotencia | Reenviar un examen no gasta otro intento | `alumnos/casos-de-uso/rendir-examen.js` |
| Escritura condicional y transacción | Sin inscripciones duplicadas; intento + nota + certificado se guardan juntos | `repositorio-inscripciones-dynamo.js`, `repositorio-intentos-dynamo.js` |
| Despliegue canario | Probar una versión nueva con el 10% del tráfico | `scripts/canario.sh`, `scripts/generar-carga.js` |
| Chaos Engineering | Inyectar fallas y latencia a propósito | `compartido/inyectar-fallas.js`, `scripts/experimento-chaos-videos.js` |

**Seguridad:**
- Cognito guarda las contraseñas y API Gateway valida el token antes de llamar a la Lambda.
- El rol se lee de la tabla Usuarios y cada caso de uso lo exige.
- El examen nunca envía las respuestas correctas.
- No hay registro público: las cuentas las crea el admin.
- Las credenciales de AWS no están en el código (las entrega el rol LabRole).

**i18n:** los errores responden en español o en inglés según `Accept-Language` (`compartido/mensajes-es-en.js`).

## Probar en tu computador (sin AWS)

Requisito: Node 22 o superior. Todos los comandos se corren dentro de `backend/`.

```bash
cd backend
npm test          # pruebas automáticas
npm run local     # API en http://localhost:3000 con datos de ejemplo
```

En local no hay Cognito: el usuario se indica con el encabezado `x-usuario-id` (`admin-1`, `docente-1` o `alumno-1`).

```bash
curl localhost:3000/salud
curl -H 'x-usuario-id: alumno-1' localhost:3000/catalogo
curl -H 'x-usuario-id: alumno-1' -H 'content-type: application/json' -X POST localhost:3000/inscripciones -d '{"cursoId":"curso-1"}'
```

Para el resto de las rutas, importa `demo/alumco.postman_collection.json` en Postman.

## Desplegar en AWS (Learner Lab)

1. Inicia el lab y copia las credenciales (AWS Details → AWS CLI) en `~/.aws/credentials`.
2. Instala las dependencias y despliega:
   ```bash
   npm install
   npm run deploy
   ```
3. Crea el primer administrador:
   ```bash
   bash scripts/crear-admin.sh admin@alumco.cl "Administración Alumco" 'Clave-Segura1'
   ```
4. Inicia sesión con `POST /auth/login` y usa el `idToken` como `Authorization: Bearer <idToken>`.

La URL de la API aparece al final de `npm run deploy`. También se puede obtener con `bash scripts/canario.sh url`.

## Despliegue canario

```bash
bash scripts/canario.sh preparar         # v1 estable; la API pasa a llamar al alias "live"
bash scripts/canario.sh publicar-mala    # v2 con 30% de errores y +400 ms (para la demo)
bash scripts/canario.sh canario 10       # 10% del tráfico a v2
TOKEN=<idToken> node scripts/generar-carga.js <URL>/catalogo
bash scripts/canario.sh revertir         # v2 está peor: rollback a v1
```

Con una versión buena se usa `npx serverless deploy function -f alumnos` + `canario.sh publicar` y, si las métricas están bien, `canario.sh promover`.

## Chaos Engineering

- `node scripts/experimento-chaos-videos.js` simula la caída de YouTube/Drive y muestra cómo el Circuit Breaker se abre y se recupera.
- En AWS, las variables `CHAOS_TASA_FALLAS`, `CHAOS_LATENCIA_MS` y `CHAOS_VIDEOS_CAIDOS` de cada Lambda inyectan fallas sin cambiar el código.

## CI/CD

`.github/workflows/ci.yml` (en la raíz del repositorio) corre las pruebas en cada push y pull request. El despliegue a AWS se lanza a mano desde la pestaña Actions, con las credenciales del lab guardadas como secrets.
