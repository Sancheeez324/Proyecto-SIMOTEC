// psicologoHandler.js

const { queryWithTransaction } = require("../../config/database");
const { generateResponse } = require("../../utils/utils");

/**
 * Endpoint: GET /ece/respuestas?test_id=...&user_id=...
 * Lista las respuestas abiertas del test ECE para un evaluado.
 * Solo accesible para usuarios con rol 'psicologo'.
 */
module.exports.listECEResponses = async (event) => {
  try {
    // Extraemos parámetros de la query string
    const { test_id, user_id } = event.queryStringParameters;
    if (!test_id || !user_id) {
      return generateResponse(400, { message: "Missing test_id or user_id" });
    }

    // Ejecutar la consulta en una transacción
    return await queryWithTransaction(async (connection) => {
      const query = `
        SELECT oa.id, oa.question_id, oa.response_text, q.question_text
        FROM open_answers oa
        JOIN questions q ON oa.question_id = q.id
        WHERE oa.test_id = ? AND oa.user_id = ?`;
      const [responses] = await connection.execute(query, [test_id, user_id]);
      return generateResponse(200, { responses });
    });
  } catch (error) {
    console.error("Error listing ECE responses:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

/**
 * Endpoint: POST /ece/evaluar
 * Permite al psicólogo enviar la evaluación manual del test ECE.
 * Se espera recibir en el body un JSON como:
 * {
 *   "test_result_id": <id del resultado del test>,
 *   "evaluations": [
 *      {
 *         "subdimension_id": <id de la subdimensión>,
 *         "evaluation_level": "bajo" | "medio" | "alto",
 *         "evaluator_comments": "comentarios opcionales"
 *      },
 *      ...
 *   ]
 * }
 * Se asume que el ID del evaluador está en event.requestContext.authorizer.userId.
 */
module.exports.submitManualEvaluation = async (event) => {
  try {
    const { test_result_id, evaluations } = JSON.parse(event.body);
    if (!test_result_id || !evaluations || !Array.isArray(evaluations)) {
      return generateResponse(400, { message: "Missing or invalid fields" });
    }

    // Obtenemos el ID del evaluador (psicólogo) desde el token
    const evaluator_id = event.requestContext.authorizer.userId;

    return await queryWithTransaction(async (connection) => {
      // Insertar cada evaluación manual
      for (const evalItem of evaluations) {
        await connection.execute(
          `INSERT INTO manual_evaluations 
            (test_result_id, subdimension_id, evaluation_level, evaluator_comments, evaluator_id)
           VALUES (?, ?, ?, ?, ?)`,
          [test_result_id, evalItem.subdimension_id, evalItem.evaluation_level, evalItem.evaluator_comments, evaluator_id]
        );
      }
      return generateResponse(201, { message: "Evaluation submitted successfully" });
    });
  } catch (error) {
    console.error("Error submitting manual evaluation:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};
