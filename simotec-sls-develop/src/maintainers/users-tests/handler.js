const { queryWithTransaction } = require("../../config/database");
const { generateResponse } = require("../../utils/utils");
const { validateToken } = require("../../config/auth");

// TODO: Agregar validaciones de tiempo al test⚠️

// Función startTest usando created_at en lugar de last_start_time
module.exports.startTest = async (event) => {
  try {
    const { test_id, evaluation_cycle_id, round_id } = JSON.parse(event.body);

    if (!test_id || !evaluation_cycle_id || !round_id) {
      return generateResponse(400, {
        message: "Test ID, Evaluation Cycle ID, and Round ID are required",
      });
    }

    const token = event.headers["authorization"];
    const userData = await validateToken(token, ["compania_usuario"]);

    return await queryWithTransaction(async (connection) => {
      const [cycleInfo] = await connection.execute(
        `SELECT ec.id AS cycle_id, ec.status AS cycle_status, r.status AS round_status
           FROM evaluation_cycles ec
           JOIN rounds r ON r.evaluation_cycle_id = ec.id
           JOIN assigned_tests at ON at.round_id = r.id
           WHERE ec.status = 'active'
             AND r.status = 'pending'
             AND at.user_id = ? 
             AND at.test_id = ? 
             AND ec.id = ? 
             AND r.id = ?`,
        [userData.id, test_id, evaluation_cycle_id, round_id]
      );

      if (cycleInfo.length === 0) {
        return generateResponse(403, {
          message: "Invalid cycle, round, or test assignment",
        });
      }

      const [existingProgress] = await connection.execute(
        "SELECT * FROM test_progress WHERE user_id = ? AND assigned_test_id = ?",
        [userData.id, test_id]
      );

      if (existingProgress.length > 0) {
        return generateResponse(200, {
          message: "Test already started",
          progress: existingProgress[0],
        });
      }

      // Usando created_at como campo de inicio del test
      await connection.execute(
        "INSERT INTO test_progress (user_id, assigned_test_id, time_spent, created_at) VALUES (?, ?, ?, NOW())",
        [userData.id, test_id, 0]
      );

      return generateResponse(201, {
        message: "Test started",
        test_id,
        evaluation_cycle_id,
        round_id,
        time_spent: 0,
      });
    });
  } catch (error) {
    console.error("Error starting test:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.saveTestProgress = async (event) => {
  try {
    const { test_id, evaluation_cycle_id, round_id, questions } = JSON.parse(
      event.body
    );

    if (
      !test_id ||
      !evaluation_cycle_id ||
      !round_id ||
      !questions ||
      questions.length === 0
    ) {
      return generateResponse(400, {
        message:
          "Test ID, evaluation cycle ID, round ID, and questions are required",
      });
    }

    const token = event.headers["authorization"];
    const userData = await validateToken(token, ["compania_usuario"]);

    console.debug(
      `ACTUALIZANDO TEST: ${test_id} - cycle:${evaluation_cycle_id} - round:${round_id}`
    );

    return await queryWithTransaction(async (connection) => {
      // Obtener información del test y el progreso
      const [testInfo] = await connection.execute(
        `SELECT tp.created_at, t.elapsed_time
         FROM test_progress tp
         JOIN tests t ON tp.assigned_test_id = ?
         WHERE tp.user_id = ? AND tp.assigned_test_id = ?`,
        [test_id, userData.id, test_id]
      );

      if (testInfo.length === 0) {
        return generateResponse(404, { message: "Test progress not found" });
      }

      // Calcular tiempo transcurrido
      const timeElapsed = await calculateElapsedTime(
        connection,
        userData.id,
        test_id
      );

      console.debug(`INIT updateTemporaryResponses()`);
      // Actualizar respuestas temporales
      await updateTemporaryResponses(
        connection,
        userData.id,
        test_id,
        evaluation_cycle_id,
        round_id,
        questions
      );

      console.debug(`END updateTemporaryResponses()`);

      return generateResponse(200, {
        message: "Test progress and responses saved",
        test_id,
        timeElapsed,
      });
    });
  } catch (error) {
    console.error("Error saving test progress and responses:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.getTestProgress = async (event) => {
  try {
    const { test_id, evaluation_cycle_id, round_id } = JSON.parse(event.body);
    const token = event.headers["authorization"];
    const userData = await validateToken(token, ["compania_usuario"]);

    return await queryWithTransaction(async (connection) => {
      // Calcular tiempo transcurrido
      const timeElapsed = await calculateElapsedTime(
        connection,
        userData.id,
        test_id
      );

      // Consulta optimizada para obtener preguntas y opciones seleccionadas por el usuario
      const [questions] = await connection.execute(
        `SELECT 
            q.id AS question_id,
            q.question_text,
            q.question_type,
            qo.id AS option_id,
            qo.option_text,
            CASE WHEN selected_options.selected_option_id = qo.id THEN 1 ELSE 0 END AS is_selected
         FROM 
            questions q
         JOIN 
            assigned_tests at ON at.test_id = q.test_id
         JOIN 
            rounds r ON r.id = at.round_id
         LEFT JOIN 
            question_options qo ON qo.question_id = q.id
         LEFT JOIN 
            (
                SELECT 
                    question_id, selected_option_id 
                FROM 
                    user_responses_temp 
                WHERE 
                    user_id = ? 
                    AND assigned_test_id = ?
                    AND round_id = ? 
                    AND evaluation_cycle_id = ?
            ) AS selected_options ON selected_options.question_id = q.id
         WHERE 
            at.test_id = ? 
            AND at.round_id = ? 
            AND r.evaluation_cycle_id = ?`,
        [
          userData.id,
          test_id,
          round_id,
          evaluation_cycle_id,
          test_id,
          round_id,
          evaluation_cycle_id,
        ]
      );

      // Reorganizar las preguntas y opciones en el formato esperado
      const questionsWithOptions = questions.reduce((acc, row) => {
        let question = acc.find((q) => q.question_id === row.question_id);

        if (!question) {
          question = {
            question_id: row.question_id,
            question_text: row.question_text,
            question_type: row.question_type,
            options: [],
          };
          acc.push(question);
        }

        question.options.push({
          option_id: row.option_id,
          option_text: row.option_text,
          is_selected: row.is_selected,
        });

        return acc;
      }, []);

      return generateResponse(200, {
        test_id,
        timeElapsed,
        questions: questionsWithOptions,
      });
    });
  } catch (error) {
    console.error("Error in getTestProgress:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.confirmTestCompletion = async (event) => {
  try {
    const { test_id, evaluation_cycle_id, round_id, questions } = JSON.parse(
      event.body
    );

    if (
      !test_id ||
      !evaluation_cycle_id ||
      !round_id ||
      !questions ||
      questions.length === 0
    ) {
      return generateResponse(400, {
        message:
          "Test ID, Evaluation Cycle ID, Round ID, and questions are required",
      });
    }

    const token = event.headers["authorization"];
    const userData = await validateToken(token, ["compania_usuario"]);

    return await queryWithTransaction(async (connection) => {
      // Paso 3: Guardar respuestas en `user_responses`
      for (const question of questions) {
        if (question && question.options) {
          const selectedOption = question.options.find(
            (option) => option.is_selected === 1
          );

          if (selectedOption) {
            await connection.execute(
              `INSERT INTO user_responses (user_id, assigned_test_id, question_id, selected_option_id, round_id, evaluation_cycle_id)
              VALUES (?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE selected_option_id = VALUES(selected_option_id)`,
              [
                userData.id,
                test_id,
                question.question_id,
                selectedOption.option_id,
                round_id,
                evaluation_cycle_id,
              ]
            );
          }
        }
      }

      // Paso 4: Actualizar el estado del test en `assigned_tests` a 'completed'
      await connection.execute(
        `UPDATE assigned_tests at
         JOIN rounds r ON at.round_id = r.id
         SET at.status = 'completed'
         WHERE at.user_id = ? AND at.test_id = ? AND at.round_id = ? AND r.evaluation_cycle_id = ?`,
        [userData.id, test_id, round_id, evaluation_cycle_id]
      );

      // Paso 5: Registrar la finalización en `test_logs`
      await connection.execute(
        `INSERT INTO test_logs (user_id, assigned_test_id, event_type)
         VALUES (?, ?, 'complete')`,
        [userData.id, test_id]
      );

      return generateResponse(200, {
        message: "Test completed successfully",
      });
    });
  } catch (error) {
    console.error("Error completing test:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

// #################################################
// FUNCIONES AUXILIARES
// #################################################
async function updateTemporaryResponses(
  connection,
  userId,
  testId,
  evaluationCycleId,
  roundId,
  questions
) {
  for (const question of questions) {
    const { question_id, options } = question;
    const selectedOption = options.find((option) => option.is_selected === 1);

    if (selectedOption) {
      const { option_id } = selectedOption;

      const [existingResponse] = await connection.execute(
        `SELECT id FROM user_responses_temp 
         WHERE user_id = ? AND assigned_test_id = ? AND question_id = ? AND round_id = ? AND evaluation_cycle_id = ?`,
        [userId, testId, question_id, roundId, evaluationCycleId]
      );

      if (existingResponse.length > 0) {
        await connection.execute(
          `UPDATE user_responses_temp SET selected_option_id = ? WHERE id = ?`,
          [option_id, existingResponse[0].id]
        );
      } else {
        await connection.execute(
          `INSERT INTO user_responses_temp (user_id, assigned_test_id, question_id, selected_option_id, round_id, evaluation_cycle_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, testId, question_id, option_id, roundId, evaluationCycleId]
        );
      }
    } else {
      await connection.execute(
        `DELETE FROM user_responses_temp 
         WHERE user_id = ? AND assigned_test_id = ? AND question_id = ? AND round_id = ? AND evaluation_cycle_id = ?`,
        [userId, testId, question_id, roundId, evaluationCycleId]
      );
    }
  }
}

// Función auxiliar para calcular el tiempo transcurrido desde el inicio del test
async function calculateElapsedTime(connection, userId, testId) {
  const [progress] = await connection.execute(
    `SELECT created_at FROM test_progress WHERE user_id = ? AND assigned_test_id = ?`,
    [userId, testId]
  );

  if (progress.length === 0) {
    return 0; // Si no hay progreso registrado, el tiempo transcurrido es 0
  }

  const createdAt = new Date(progress[0].created_at);
  const currentTime = new Date();
  const timeElapsed = Math.floor((currentTime - createdAt) / 1000); // Tiempo en segundos

  return timeElapsed;
}


// TODO: IMPLEMENTAR ESTA FUNCIÓN⚠️
// Funcion para validar si un test ha sido completado.
// probada ok en base de datos local.
const isTestCompleted = async (
  connection,
  test_id,
  evaluation_cycle_id,
  round_id,
  user_id
) => {
  // Query para verificar si el número de respuestas del usuario coincide con el número total de preguntas
  const [result] = await connection.execute(
    `
    SELECT COUNT(q.id) = COUNT(ur.id) AS is_completed
    FROM questions q
    LEFT JOIN user_responses ur 
      ON ur.question_id = q.id
      AND ur.assigned_test_id = ?
      AND ur.evaluation_cycle_id = ?
      AND ur.round_id = ?
      AND ur.user_id = ?
    WHERE q.test_id = ?
    `,
    [test_id, evaluation_cycle_id, round_id, user_id, test_id]
  );

  // Retornar true o false según si el test está completo
  return result[0].is_completed === 1;
};
