// Archivo de demo para procesar las respuestas de un test.
const { generateResponse, getFechaChile } = require("../../utils/utils");
const { queryWithTransaction } = require("../../config/database");

/**
 * Función para obtener las preguntas de un test junto con sus opciones.
 * Esta función se debe ejecutar en el flujo de un test, para cargar las preguntas en el frontend.
 *
 * Observaciones:
 * - El testId se recibe como parámetro en el evento.
 * @function getTestQuestions
 * @param {*} event
 */
module.exports.getTestQuestions = async (event) => {
  try {
    console.debug("getTestQuestions");

    // obtener todas las preguntas del test 1: Seguridad Operarios.
    const testId = 1; // se recibirá como parámetro en el evento.

    const query = `
      SELECT 
        q.id as question_id, 
        q.question_text, 
        q.type, 
        o.id as option_id, 
        o.option_text
      FROM 
        questions q
      LEFT JOIN 
        options o ON q.id = o.question_id
      WHERE 
        q.test_id = ?;
    `;
    const params = [testId];

    // use queryWithTransaction para ejecutar la consulta.
    const result = await queryWithTransaction(async (connection) => {
      const [rows] = await connection.execute(query, params);
      return rows;
    });

    console.debug(`DEBUG: resultados totales obtenidos: ${result.length}`);

    // Agrupar preguntas y opciones
    const questions = result.reduce((acc, row) => {
      const {
        question_id,
        question_text,
        type,
        option_id,
        option_text,
        is_correct,
      } = row;

      // Si la pregunta no existe en el acumulador, añadirla
      if (!acc[question_id]) {
        acc[question_id] = {
          question_id,
          question_text,
          type,
          options: [],
        };
      }

      // Añadir la opción correspondiente a la pregunta
      acc[question_id].options.push({
        option_id,
        option_text,
        is_correct,
      });

      return acc;
    }, {});

    const questionsArray = Object.values(questions);

    const currentDate = getFechaChile(null, true);

    // retornar la respuesta.
    return generateResponse(200, { currentDate, questions: questionsArray });
  } catch (error) {
    console.error(error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

/**
 * Todo:
 * Función para recibir las respuestas de un test.
 *
 * Por ahora esta funcion procesa solamente trabja con el test 1: Seguridad Operarios.
 * pero en el futuro es necsario refactorizar para que trabaje con cualquier test.
 *
 * Seria una buena idea llevarse el calculo del puntaje a una funcion aparte.
 * y que cada test tenga su logica/funcion para procesar los resultados.
 *
 *
 * AGREGAR: ⚠️⚠️
 * - Validaciones para los datos recibidos, que no caiga en un error si no se reciben los datos esperados.
 * 
 * - Validar que el test_id, participant_id y evaluation_part_id existan en la base de datos.
 * - Validar si el test ya fue completado por el participante.
 * @function submitTestAnswers
 * @param {*} event
 */
module.exports.submitTestAnswers = async (event) => {
  try {
    const { participant_id, test_id, evaluation_part_id, answers } = JSON.parse(
      event.body
    );

    // Validación de los datos de entrada
    if (
      !participant_id ||
      !test_id ||
      !evaluation_part_id ||
      !answers ||
      !Array.isArray(answers)
    ) {
      return generateResponse(400, { message: "Invalid input data" });
    }

    const result = await queryWithTransaction(async (connection) => {
      // Obtener el passing_score actual del test
      const testQuery = `SELECT passing_score FROM tests WHERE id = ?`;
      const [testRows] = await connection.execute(testQuery, [test_id]);
      const passingScore = testRows[0].passing_score;

      const date = getFechaChile(null, true);

      // Crear un registro inicial en test_results
      const insertTestResultQuery = `
        INSERT INTO test_results (assigned_test_id, score, passing_score, passed, completion_date)
        VALUES (?, 0, ?, FALSE, ?)
      `;
      const insertTestResultParams = [evaluation_part_id, passingScore, date];
      const [testResult] = await connection.execute(
        insertTestResultQuery,
        insertTestResultParams
      );
      const test_result_id = testResult.insertId;

      let score = 0;

      // Procesar cada respuesta
      for (let answer of answers) {
        const { question_id, selected_option_id } = answer;

        // Validar que la opción seleccionada existe y es correcta
        const query = `
          SELECT is_correct FROM options 
          WHERE id = ? AND question_id = ?
        `;
        const params = [selected_option_id, question_id];

        const [rows] = await connection.execute(query, params);
        const optionResult = rows[0];

        if (!optionResult) {
          throw new Error(
            `Invalid option selected for question ${question_id}`
          );
        }

        if (optionResult.is_correct) {
          score += 1;
        }

        // Insertar la respuesta en la tabla answers
        const insertAnswerQuery = `
          INSERT INTO answers (test_result_id, question_id, selected_option_id) 
          VALUES (?, ?, ?)
        `;
        const insertAnswerParams = [
          test_result_id,
          question_id,
          selected_option_id,
        ];

        await connection.execute(insertAnswerQuery, insertAnswerParams);
      }

      // Determinar si el usuario pasó el test
      const passed = score >= passingScore;

      // Actualizar el registro en test_results con el puntaje y estado de aprobación
      const updateTestResultQuery = `
        UPDATE test_results 
        SET score = ?, passed = ?, completion_date = NOW()
        WHERE id = ?
      `;
      const updateTestResultParams = [score, passed, test_result_id];

      await connection.execute(updateTestResultQuery, updateTestResultParams);

      // Actualizar el estado en assigned_tests a 'completado'
      const updateAssignedTestQuery = `
        UPDATE assigned_tests 
        SET status = 'completado'
        WHERE id = ?
      `;
      await connection.execute(updateAssignedTestQuery, [evaluation_part_id]);

      return { score, passed };
    });

    return generateResponse(200, {
      message: "Test submitted successfully",
      score: result.score,
      passed: result.passed,
    });
  } catch (error) {
    console.error(error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};
