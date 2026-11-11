const { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand} = require('@aws-sdk/lib-dynamodb');
const { clienteDynamo, nombreTabla } = require('../compartido/cliente-dynamo');
const { Curso } = require('./curso');

class RepositorioCursoDynamo {
    constructor() {
        this.tabla = nombreTabla('TABLA_CURSOS');
        this.db = clienteDynamo();
    }

    async guardar(curso) {
        await this.db.send(new PutCommand({ TableName: this.tabla, Item: curso.datos() }));
    }

    async buscarPorId(cursoId) {
        const { Item } = await this.db.send(new GetCommand({ TableName: this.tabla, Key: {cursoId } }));
        return Item ? Curso.restaurar(Item) : undefined;
    }

    async listarPublicados() {
        return this.consultarIndice('porEstado', 'estado', 'publicado');
    }

    async listarPorDocente(docenteId) {
        return this.consultarIndice('porDocente', 'docenteId', docenteId);
    }

    async listarTodos() {
        const { Items } = await this.db.send(new ScanCommand({ TableName: this.tabla }));
        return Items.map((fila) => Curso.restaurar(fila));
    }

    async eliminar(cursoId) {
        await this.db.send(new DeleteCommand({ TableName: this.tabla, Key: { cursoId } }));
    }

    async consultarIndice(indice, campo, valor) {
        const { Items } = await this.db.send(new QueryCommand({ TableName: this.tabla, IndexName: indice, KeyConditionExpression: '#campo = :valor', ExpressionAttributeNames: { '#campo': campo }, ExpressionAttributeValues: { ':valor': valor }, }),);
        return Items.map((fila) => Curso.restaurar(fila));
    }
}

module.exports = RepositorioCursoDynamo;