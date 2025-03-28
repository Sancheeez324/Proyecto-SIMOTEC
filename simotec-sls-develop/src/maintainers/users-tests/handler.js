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

// 1. Obtener tests asignados
module.exports.getAssignedTests = async (event) => {
    try {
        return await queryWithTransaction(async (connection) => {
            const auth_user_id = event.pathParameters?.auth_user_id;
            if (!auth_user_id) {
                return generateResponse(400, { message: "Se requiere auth_user_id" });
            }

            const user_id = await getUserIdFromAuth(connection, auth_user_id);
            if (!user_id) {
                return generateResponse(404, { message: "Usuario no encontrado" });
            }

            const [tests] = await connection.query(
                `SELECT 
                    at.id as assigned_test_id, 
                    t.id as test_id, 
                    t.test_name, 
                    t.description,
                    at.status, 
                    at.start_time, 
                    at.duration_minutes,
                    t.passing_score,
                    t.sector,
                    t.tipo
                 FROM assigned_tests at
                 JOIN tests t ON at.test_id = t.id 
                 WHERE at.user_id = ? AND at.status IN ('pendiente', 'reiniciado')`,
                [user_id]
            );
            
            return generateResponse(200, tests);
        });
    } catch (error) {
        console.error("Error en getAssignedTests:", error);
        return generateResponse(500, { 
            message: "Error interno del servidor",
            error: error.message 
        });
    }
};

// 2. Enviar respuestas del test
module.exports.submitTest = async (event) => {
    try {
        return await queryWithTransaction(async (connection) => {
            const { test_id } = event.pathParameters;
            const { auth_user_id, responses, selected_question_ids } = parseEventBody(event); // Nuevo campo

            // Validaciones básicas
            if (!auth_user_id || !responses || !Array.isArray(responses) || !selected_question_ids) {
                return generateResponse(400, { message: "Datos de entrada inválidos" });
            }

            // Verificar que las preguntas respondidas pertenecen a las seleccionadas
            const invalidQuestions = responses.filter(r => 
                !selected_question_ids.includes(r.question_id)
            );
            
            if (invalidQuestions.length > 0) {
                return generateResponse(400, { 
                    message: "Algunas preguntas no pertenecen a este test",
                    invalid_questions: invalidQuestions.map(q => q.question_id)
                });
            }


            const user_id = await getUserIdFromAuth(connection, auth_user_id);
            if (!user_id) {
                return generateResponse(404, { message: "Usuario no encontrado" });
            }

            // Verificar test asignado
            const [[test]] = await connection.query(
                `SELECT at.id as assigned_test_id, t.passing_score
                 FROM assigned_tests at
                 JOIN tests t ON at.test_id = t.id
                 WHERE t.id = ? AND at.user_id = ?`,
                [test_id, user_id]
            );
            
            if (!test) {
                return generateResponse(404, { message: "Test no encontrado o no asignado" });
            }

            // Procesar respuestas
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
                 SET status = ?, score = ?, completed_at = ?
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



// Obtener las preguntas de los tests
// 3. Obtener preguntas de un test
module.exports.getTestQuestions = async (event) => {
    try {
        return await queryWithTransaction(async (connection) => {
            const { test_id } = event.pathParameters;
            const auth_user_id = event.queryStringParameters?.auth_user_id;

            // Validaciones básicas
            if (!test_id || isNaN(test_id)) {
                return generateResponse(400, { message: "ID de test inválido" });
            }

            if (!auth_user_id) {
                return generateResponse(400, { message: "Se requiere auth_user_id" });
            }

            // Verificar que el test está asignado al usuario
            const user_id = await getUserIdFromAuth(connection, auth_user_id);
            const [[assignment]] = await connection.query(
                `SELECT id FROM assigned_tests 
                 WHERE test_id = ? AND user_id = ? AND status IN ('pendiente', 'reiniciado')`,
                [test_id, user_id]
            );

            if (!assignment) {
                return generateResponse(403, { message: "Test no asignado o ya completado" });
            }

            // Paso 1: Obtener el TOTAL de preguntas disponibles para este test
            const [[{ total_questions }]] = await connection.query(
                `SELECT COUNT(*) as total_questions FROM questions 
                 WHERE test_id = ?`,
                [test_id]
            );

            // Paso 2: Seleccionar 20 IDs de preguntas aleatorias
            const [randomQuestions] = await connection.query(
                `SELECT id FROM questions 
                 WHERE test_id = ?
                 ORDER BY RAND()  /* Función aleatoria específica de MySQL */
                 LIMIT 20`,
                [test_id]
            );

            // Si no hay suficientes preguntas
            if (randomQuestions.length === 0) {
                return generateResponse(404, { message: "No hay preguntas disponibles para este test" });
            }

            const questionIds = randomQuestions.map(q => q.id);

            // Paso 3: Obtener las preguntas seleccionadas con sus opciones
            const [questions] = await connection.query(
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
                 ORDER BY FIELD(q.id, ?)  /* Mantener el orden aleatorio */`,
                [questionIds, questionIds]
            );

            // Formatear respuesta
            const formattedQuestions = questions.map(q => ({
                ...q,
                options: q.options ? q.options.filter(opt => opt !== null) : [],
                metadata: {
                    total_questions: total_questions,
                    questions_selected: questions.length
                }
            }));

            return generateResponse(200, {
                questions: formattedQuestions,
                assigned_test_id: assignment.id
            });
        });
    } catch (error) {
        console.error("Error en getTestQuestions:", error);
        return generateResponse(500, { 
            message: "Error al obtener preguntas",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
//Obtener test especifico por ID
// Obtener un test asignado específico por su ID
module.exports.getAssignedTestById = async (event) => {
    try {
        return await queryWithTransaction(async (connection) => {
            const assigned_test_id = event.pathParameters.assigned_test_id;
            
            console.log("Buscando test asignado con ID:", assigned_test_id);

            // Validar que el ID es numérico
            if (isNaN(assigned_test_id)) {
                return generateResponse(400, { 
                    message: "ID de test asignado inválido",
                    received_id: assigned_test_id
                });
            }

            // Consulta corregida (sin punto y coma en medio)
            const [[test]] = await connection.query(
                `SELECT 
                    at.id as assigned_test_id,
                    at.user_id,
                    at.status,
                    at.start_time,
                    at.duration_minutes,
                    at.passing_score,
                    t.id as test_id,
                    t.test_name,
                    t.description,
                    t.passing_score,
                    t.sector,
                    t.tipo
                 FROM assigned_tests at
                 JOIN tests t ON at.test_id = t.id
                 WHERE at.id = ?`,
                [assigned_test_id]
            );

            if (!test) {
                return generateResponse(404, { 
                    message: "Test asignado no encontrado",
                    test_id: assigned_test_id
                });
            }

            return generateResponse(200, test);
        });
    } catch (error) {
        console.error("Error en getAssignedTestById:", {
            message: error.message,
            sql: error.sql,
            stack: error.stack
        });
        return generateResponse(500, { 
            message: "Error interno del servidor",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};