const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile, parseEventBody } = require("../../utils/utils");

// Función auxiliar que recibe la conexión
const getUserIdFromAuth = async (connection, auth_user_id) => {
    const [[user]] = await connection.query(
        "SELECT id FROM users WHERE auth_user_id = ?", 
        [auth_user_id]
    );
    return user ? user.id : null;
};

// Función auxiliar para parsear JSON de forma segura
const safeParseJSON = (jsonString) => {
  try {
      return jsonString ? JSON.parse(jsonString) : null;
  } catch (e) {
      console.error("Error parsing JSON:", jsonString, e);
      return null;
  }
};

module.exports.submitTest = async (event) => {
    try {
        return await queryWithTransaction(async (connection) => {
            const { test_id } = event.pathParameters;
            const { auth_user_id, responses } = parseEventBody(event);

            // Validaciones básicas
            if (!auth_user_id || !responses || !Array.isArray(responses)) {
                return generateResponse(400, { message: "Datos de entrada inválidos" });
            }

            const user_id = await getUserIdFromAuth(connection, auth_user_id);
            if (!user_id) {
                return generateResponse(404, { message: "Usuario no encontrado" });
            }

            // Obtener test asignado con las preguntas seleccionadas
            const [[test]] = await connection.query(
                `SELECT at.id as assigned_test_id, t.passing_score, at.selected_questions
                 FROM assigned_tests at
                 JOIN tests t ON at.test_id = t.id
                 WHERE t.id = ? AND at.user_id = ?`,
                [test_id, user_id]
            );
            
            if (!test) {
                return generateResponse(404, { message: "Test no encontrado o no asignado" });
            }

            // Verificar que las preguntas respondidas pertenecen a las seleccionadas
            const selectedQuestions = test.selected_questions ? JSON.parse(test.selected_questions) : [];
            const invalidQuestions = responses.filter(r => 
                !selectedQuestions.includes(r.question_id)
            );
            
            if (invalidQuestions.length > 0) {
                return generateResponse(400, { 
                    message: "Algunas preguntas no pertenecen a este test",
                    invalid_questions: invalidQuestions.map(q => q.question_id)
                });
            }

            // Procesar respuestas (igual que antes)
            let totalScore = 0;
            let totalWeight = 0;
            const questionIds = responses.map(r => r.question_id);

            const [questions] = await connection.query(
                `SELECT q.id, q.weight, q.type,
                 GROUP_CONCAT(o.id ORDER BY o.id SEPARATOR ',') as correct_options
                 FROM questions q
                 LEFT JOIN options o ON q.id = o.question_id AND o.is_correct = 1
                 WHERE q.test_id = ? AND q.id IN (?)
                 GROUP BY q.id`,
                [test_id, questionIds]
            );

            if (questions.length !== responses.length) {
                return generateResponse(400, { message: "Algunas preguntas no pertenecen a este test" });
            }

            // Calcular puntaje
            responses.forEach(response => {
                const question = questions.find(q => q.id === response.question_id);
                if (!question) return;

                const correctOptions = question.correct_options?.split(',').map(Number) || [];
                const userAnswers = Array.isArray(response.selected_options) 
                    ? response.selected_options.map(Number) 
                    : [];

                const isCorrect = question.type === 'simple'
                    ? userAnswers.length === 1 && correctOptions.includes(userAnswers[0])
                    : correctOptions.length === userAnswers.length && 
                      correctOptions.every(id => userAnswers.includes(id));

                if (isCorrect) totalScore += question.weight;
                totalWeight += question.weight;
            });

            // Calcular puntaje final
            const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
            const newStatus = finalScore >= test.passing_score ? "completado" : "reiniciado";

            // Actualizar test asignado
            await connection.query(
                `UPDATE assigned_tests 
                 SET status = ?, score = ?, completed_at = ?, answers = NULL, progress = 100
                 WHERE id = ?`,
                [newStatus, finalScore, getFechaChile(null, true), test.assigned_test_id]
            );

            return generateResponse(200, { 
                message: "Test evaluado", 
                passed: newStatus === "completado",
                score: finalScore.toFixed(2),
                passing_score: test.passing_score,
                status: newStatus
            });
        });
    } catch (error) {
        console.error("Error en submitTest:", error);
        return generateResponse(500, { 
            message: "Error al procesar respuestas",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports.saveTestProgress = async (event) => {
    try {
        return await queryWithTransaction(async (connection) => {
            // Usamos assigned_test_id ya que la ruta es /user-test/{assigned_test_id}/saveProgress
            const { assigned_test_id } = event.pathParameters;
            const { auth_user_id, answers, current_question } = parseEventBody(event);

            // Validación básica
            if (!auth_user_id || !answers || typeof answers !== 'object') {
                return generateResponse(400, { message: "Datos de entrada inválidos" });
            }

            const user_id = await getUserIdFromAuth(connection, auth_user_id);
            if (!user_id) {
                return generateResponse(404, { message: "Usuario no encontrado" });
            }

            // Buscar el test asignado usando assigned_test_id
            const [[test]] = await connection.query(
                `SELECT id, selected_questions FROM assigned_tests 
                 WHERE id = ? AND user_id = ? AND status IN ('pendiente', 'reiniciado')`,
                [assigned_test_id, user_id]
            );
            
            if (!test) {
                return generateResponse(404, { message: "Test no encontrado o no asignado" });
            }

            // Calcular el progreso
            let progress = 0;
            if (current_question) {
                // Obtener el total de preguntas (usando JSON_LENGTH de selected_questions)
                const [[row]] = await connection.query(
                    `SELECT JSON_LENGTH(selected_questions) as question_count 
                     FROM assigned_tests 
                     WHERE id = ?`,
                    [test.id]
                );
                const question_count = row.question_count || 0;
                progress = question_count ? Math.floor((current_question / question_count) * 100) : 0;
            } else {
                // Si no se envía current_question, calcular el progreso basado en la cantidad de respuestas
                progress = Math.floor((Object.keys(answers).length / 20) * 100);
            }

            // Actualizar el registro del test asignado con las respuestas y el progreso
            await connection.query(
                `UPDATE assigned_tests 
                 SET answers = ?, progress = ?
                 WHERE id = ?`,
                [JSON.stringify(answers), progress, test.id]
            );

            return generateResponse(200, { 
                message: "Progreso guardado",
                progress: progress
            });
        });
    } catch (error) {
        console.error("Error en saveTestProgress:", error);
        return generateResponse(500, { 
            message: "Error al guardar progreso",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


module.exports.getTestQuestions = async (event) => {
  try {
    return await queryWithTransaction(async (connection) => {
      // Extraemos test_id de la URL y auth_user_id de los query parameters
      const { test_id } = event.pathParameters;
      const auth_user_id = event.queryStringParameters?.auth_user_id;
      
      // Validaciones básicas
      if (!test_id || isNaN(test_id)) {
        return generateResponse(400, { message: "ID de test inválido" });
      }
      if (!auth_user_id) {
        return generateResponse(400, { message: "Se requiere auth_user_id" });
      }
      
      // Obtenemos el user_id real a partir de auth_user_id
      const user_id = await getUserIdFromAuth(connection, auth_user_id);
      
      // Buscamos el registro de assigned_tests en estado "pendiente"
      const [[assignment]] = await connection.query(
        `SELECT id, status FROM assigned_tests 
         WHERE test_id = ? AND user_id = ? AND status = 'pendiente'`,
        [test_id, user_id]
      );
      
      if (!assignment) {
        return generateResponse(403, { message: "No se encontró un test pendiente asignado" });
      }
      
      // Generar el banco de preguntas
      let questionIds = [];
      let questions = [];
      let total_questions = 0;
      
      // Consultamos el total de preguntas disponibles para este test
      const [[{ total }]] = await connection.query(
        `SELECT COUNT(*) as total FROM questions WHERE test_id = ?`,
        [test_id]
      );
      total_questions = total;
      
      // Seleccionar preguntas: caso especial para test_id === 4
      if (parseInt(test_id, 10) === 4) {
        const [allQuestions] = await connection.query(
          `SELECT id FROM questions WHERE test_id = ?`,
          [test_id]
        );
        questionIds = allQuestions.map(q => q.id);
      } else {
        const [randomQuestions] = await connection.query(
          `SELECT id FROM questions 
           WHERE test_id = ?
           ORDER BY RAND()
           LIMIT 20`,
          [test_id]
        );
        questionIds = randomQuestions.map(q => q.id);
      }
      
      // Actualizamos el registro asignado: guardamos las preguntas generadas,
      // establecemos start_time, reiniciamos el progreso y cambiamos el estado a "en_progreso"
      await connection.query(
        `UPDATE assigned_tests 
         SET selected_questions = ?, start_time = ?, progress = 0, status = 'en_progreso'
         WHERE id = ?`,
        [JSON.stringify(questionIds), getFechaChile(null, true), assignment.id]
      );
      
      // Consultamos los detalles de las preguntas seleccionadas (sin el campo "subdimension")
      [questions] = await connection.query(
        `SELECT 
           q.id,
           q.question_text,
           q.type,
           q.weight,
           q.sector,
           q.image_url,
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'id', o.id,
               'option_text', o.option_text,
               'is_correct', o.is_correct
             )
           ) as options
         FROM questions q
         LEFT JOIN options o ON q.id = o.question_id
         WHERE q.id IN (?)
         GROUP BY q.id
         ORDER BY FIELD(q.id, ?)`,
        [questionIds, questionIds]
      );
      
      // Formateamos la respuesta incluyendo metadatos
      const formattedQuestions = questions.map(q => ({
        ...q,
        options: q.options ? q.options.filter(opt => opt !== null) : [],
        metadata: {
          total_questions,
          questions_selected: questions.length
        }
      }));
      
      return generateResponse(200, {
        questions: formattedQuestions,
        assigned_test_id: assignment.id,
        saved_answers: {}, // Al ser un test pendiente no hay respuestas previas
        progress: 0
      });
    });
  } catch (error) {
    console.error("Error en getTestQuestions:", {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    return generateResponse(500, {
      message: "Error al obtener preguntas",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports.getSavedQuestions = async (event) => {
  try {
    return await queryWithTransaction(async (connection) => {
      // Extraemos test_id de la URL y auth_user_id de los query parameters
      const { test_id } = event.pathParameters;
      const auth_user_id = event.queryStringParameters?.auth_user_id;
      
      // Validaciones básicas
      if (!test_id || isNaN(test_id)) {
        return generateResponse(400, { message: "ID de test inválido" });
      }
      if (!auth_user_id) {
        return generateResponse(400, { message: "Se requiere auth_user_id" });
      }
      
      // Obtenemos el user_id real
      const user_id = await getUserIdFromAuth(connection, auth_user_id);
      
      // Buscamos el registro asignado en estado "en_progreso"
      const [[assignment]] = await connection.query(
        `SELECT id, selected_questions, answers, progress 
         FROM assigned_tests 
         WHERE test_id = ? AND user_id = ? AND status = 'en_progreso'`,
        [test_id, user_id]
      );
      
      if (!assignment) {
        return generateResponse(403, { message: "No se encontró un test en progreso asignado" });
      }
      
      // Función auxiliar para parsear JSON de forma segura
      const safeParseJSON = (jsonString) => {
        try {
          return jsonString ? JSON.parse(jsonString) : null;
        } catch (e) {
          console.error("Error parsing JSON:", jsonString, e);
          return null;
        }
      };
      
      let questionIds = [];
      const savedQuestions = safeParseJSON(assignment.selected_questions);
      if (savedQuestions && Array.isArray(savedQuestions) && savedQuestions.length > 0) {
        questionIds = savedQuestions;
      } else {
        return generateResponse(400, { message: "No hay preguntas guardadas para este test." });
      }
      
      // Obtenemos el total de preguntas disponibles para este test
      const [[{ total }]] = await connection.query(
        `SELECT COUNT(*) as total FROM questions WHERE test_id = ?`,
        [test_id]
      );
      const total_questions = total;
      
      // Consultamos los detalles de las preguntas guardadas
      let questions;
      [questions] = await connection.query(
        `SELECT 
           q.id,
           q.question_text,
           q.type,
           q.weight,
           q.sector,
           q.image_url,
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'id', o.id,
               'option_text', o.option_text,
               'is_correct', o.is_correct
             )
           ) as options
         FROM questions q
         LEFT JOIN options o ON q.id = o.question_id
         WHERE q.id IN (?)
         GROUP BY q.id
         ORDER BY FIELD(q.id, ?)`,
        [questionIds, questionIds]
      );
      
      // Formateamos las preguntas incluyendo metadatos
      const formattedQuestions = questions.map(q => ({
        ...q,
        options: q.options ? q.options.filter(opt => opt !== null) : [],
        metadata: {
          total_questions,
          questions_selected: questions.length
        }
      }));
      
      // Parseamos las respuestas guardadas, si existen
      let savedAnswers = {};
      const parsedAnswers = safeParseJSON(assignment.answers);
      if (parsedAnswers && typeof parsedAnswers === 'object') {
        savedAnswers = parsedAnswers;
      }
      
      return generateResponse(200, {
        questions: formattedQuestions,
        assigned_test_id: assignment.id,
        saved_answers: savedAnswers,
        progress: assignment.progress || 0
      });
    });
  } catch (error) {
    console.error("Error en getSavedQuestions:", {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    return generateResponse(500, {
      message: "Error al obtener preguntas guardadas",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
