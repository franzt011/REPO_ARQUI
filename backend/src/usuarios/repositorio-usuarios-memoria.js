/**
 * Repositorio de usuarios en memoria (un Map). Lo usan las pruebas y el
 * servidor local. Tiene los mismos métodos que repositorio-usuarios-dynamo.js.
 */
const { Usuario } = require('./usuario');

class RepositorioUsuariosMemoria {
  constructor() {
    this.filas = new Map();
  }

  async guardar(usuario) {
    // Se guarda una copia de los datos, igual que en una base de datos real
    this.filas.set(usuario.usuarioId, usuario.datos());
  }

  async buscarPorId(usuarioId) {
    const fila = this.filas.get(usuarioId);
    return fila ? Usuario.restaurar(fila) : undefined;
  }

  async buscarPorCorreo(correo) {
    const fila = [...this.filas.values()].find((u) => u.correo === correo.toLowerCase());
    return fila ? Usuario.restaurar(fila) : undefined;
  }

  async listarTodos() {
    return [...this.filas.values()].map((fila) => Usuario.restaurar(fila));
  }
}

module.exports = RepositorioUsuariosMemoria;
