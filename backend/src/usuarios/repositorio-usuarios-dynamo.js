/**
 * Repositorio de usuarios en DynamoDB (patrón Repositorio).
 * Tabla Usuarios: clave usuarioId (el "sub" de Cognito) e índice "porCorreo".
 */
const { GetCommand, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { clienteDynamo, nombreTabla } = require('../compartido/cliente-dynamo');
const { Usuario } = require('./usuario');

class RepositorioUsuariosDynamo {
  constructor() {
    this.tabla = nombreTabla('TABLA_USUARIOS');
    this.db = clienteDynamo();
  }

  async guardar(usuario) {
    await this.db.send(new PutCommand({ TableName: this.tabla, Item: usuario.datos() }));
  }

  async buscarPorId(usuarioId) {
    const { Item } = await this.db.send(new GetCommand({ TableName: this.tabla, Key: { usuarioId } }));
    return Item ? Usuario.restaurar(Item) : undefined;
  }

  async buscarPorCorreo(correo) {
    const { Items } = await this.db.send(
      new QueryCommand({
        TableName: this.tabla,
        IndexName: 'porCorreo',
        KeyConditionExpression: 'correo = :correo',
        ExpressionAttributeValues: { ':correo': correo.toLowerCase() },
      }),
    );
    return Items.length > 0 ? Usuario.restaurar(Items[0]) : undefined;
  }

  /** Scan recorre toda la tabla: aceptable aquí porque la ONG tiene pocos cientos de usuarios. */
  async listarTodos() {
    const usuarios = [];
    let desde;
    do {
      const pagina = await this.db.send(new ScanCommand({ TableName: this.tabla, ExclusiveStartKey: desde }));
      usuarios.push(...pagina.Items.map((fila) => Usuario.restaurar(fila)));
      desde = pagina.LastEvaluatedKey;
    } while (desde);
    return usuarios;
  }
}

module.exports = RepositorioUsuariosDynamo;
