const { DeleteCommand, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { clienteDynamo, nombreTabla } = require('../compartido/cliente-dynamo');
const { Examen } = require('./examen');

class RepositorioExamenesDynamo {
    constructor() {
        this.tabla = nombreTabla('TABLA_EXAMENES');
        this.db = clienteDynamo();
    }

    async guardar(examen) {
        await this.db.send(new PutCommand({ TableName: this.tabla, Item: examen.datos() }));
    }

    async buscarPorCurso(cursoId) {
        const { Item } = await this.db.send(new GetCommand({ TableName: this.tabla, Key: { cursoId } }));
        return Item ? Examen.restaurar(Item) : undefined;
    }

    async eliminar(cursoId) {
        await this.db.send(new DeleteCommand({ TableName: this.tabla, Key: { cursoId } }));
    }
}

module.exports = RepositorioExamenesDynamo;