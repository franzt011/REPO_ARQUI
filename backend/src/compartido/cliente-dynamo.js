/**
 * Cliente de DynamoDB compartido por todos los repositorios "-dynamo".
 *
 * Usa el DocumentClient, que convierte solo los objetos de JavaScript al
 * formato de DynamoDB (no hay que escribir { S: 'texto' } a mano).
 *
 * Las credenciales NO están en el código: en Lambda las entrega el rol de
 * ejecución (LabRole en el Learner Lab). El SDK ya reintenta solo las fallas
 * transitorias con backoff exponencial y jitter.
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

let cliente;

function clienteDynamo() {
  if (!cliente) {
    cliente = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return cliente;
}

/** Nombre real de la tabla, que serverless.yml entrega como variable de entorno. */
function nombreTabla(variable) {
  const nombre = process.env[variable];
  if (!nombre) {
    throw new Error(`Falta la variable de entorno ${variable}`);
  }
  return nombre;
}

module.exports = { clienteDynamo, nombreTabla };
