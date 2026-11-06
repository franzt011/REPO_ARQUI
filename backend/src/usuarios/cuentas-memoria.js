/**
 * Reemplazo de Cognito para pruebas y para el servidor local.
 * Tiene los mismos métodos que cuentas-cognito.js.
 */
const { randomUUID } = require('node:crypto');
const { ConflictoError, NoAutenticadoError } = require('../compartido/errores');

class CuentasMemoria {
  constructor() {
    this.cuentas = new Map(); // correo → { usuarioId, contrasena, activo }
  }

  async crearCuenta({ correo, contrasena }) {
    if (this.cuentas.has(correo)) {
      throw new ConflictoError('usuario-existente', 'Ya existe una cuenta con ese correo.');
    }
    const usuarioId = randomUUID();
    this.cuentas.set(correo, { usuarioId, contrasena, activo: true });
    return usuarioId;
  }

  async iniciarSesion(correo, contrasena) {
    const cuenta = this.cuentas.get(correo);
    if (!cuenta || !cuenta.activo || cuenta.contrasena !== contrasena) {
      throw new NoAutenticadoError('credenciales-invalidas', 'Correo o contraseña incorrectos.');
    }
    // En local no hay JWT real: en modo desarrollo se usa el encabezado x-usuario-id
    return { idToken: `token-local-${cuenta.usuarioId}`, accessToken: null, refreshToken: null, expiraEnSegundos: 3600 };
  }

  async cambiarEstado(correo, activo) {
    const cuenta = this.cuentas.get(correo);
    if (cuenta) cuenta.activo = activo;
  }
}

module.exports = CuentasMemoria;
