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
            const { auth_user_id, responses } = parseEventBody(event);

            // Validaciones
            if (!auth_user_id || !responses || !Array.isArray(responses)) {
                return generateResponse(400, { message: "Datos de entrada inválidos" });
            }

            const user_id = await getUserIdFromAuth(connection, auth_user_id);
            if (!user_id) {
                return generateResponse(404, { message: "Usuario no encontrado" });
            }

            // Obtener test asignado
            const [[test]] = await connection.query(
                `SELECT t.passing_score, at.id as assigned_test_id
                 FROM tests t
                 JOIN assigned_tests at ON t.id = at.test_id
                 WHERE t.id = ? AND at.user_id = ?`,
                [test_id, user_id]
            );
            
            if (!test) {
                return generateResponse(404, { message: "Test no encontrado o no asignado al usuario" });
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

            const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
            const newStatus = finalScore >= test.passing_score ? "completado" : "reiniciado";

            // Actualizar test
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
            message: "Error interno del servidor",
            error: error.message 
        });
    }
};