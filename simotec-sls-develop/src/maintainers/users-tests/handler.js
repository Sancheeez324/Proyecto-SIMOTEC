const db = require("../../config/database");
const { generateResponse, getFechaChile, parseEventBody } = require("../../utils/utils");

// Función auxiliar para obtener el user_id desde auth_user_id
const getUserIdFromAuth = async (auth_user_id) => {
    const [[user]] = await db.query("SELECT id FROM users WHERE auth_user_id = ?", [auth_user_id]);
    return user ? user.id : null;
};

// 1. Obtener tests asignados a un usuario
module.exports.getAssignedTests = async (event) => {
    try {
        const { auth_user_id } = JSON.parse(event.body);
        console.log("Auth id recibido ", auth_user_id);
        if (!auth_user_id || isNaN(auth_user_id)) {
            return generateResponse(400, { message: "ID de usuario inválido" });
        }

        const user_id = await getUserIdFromAuth(auth_user_id);
        console.log("user id obtenido ", user_id);
        if (!user_id) {
            return generateResponse(404, { message: "Usuario no encontrado" });
        }

        const [tests] = await db.query(
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
    } catch (error) {
        console.error("Error al obtener tests asignados:", error);
        return generateResponse(500, { message: "Error interno del servidor" });
    }
};

// 2. Enviar respuestas del test
module.exports.submitTest = async (event) => {
    const transaction = await db.beginTransaction();
    try {
        const { test_id } = event.pathParameters;
        const { auth_user_id, responses } = parseEventBody(event);

        if (!auth_user_id || !responses || !Array.isArray(responses)) {
            await transaction.rollback();
            return generateResponse(400, { message: "Datos de entrada inválidos" });
        }

        const user_id = await getUserIdFromAuth(auth_user_id);
        if (!user_id) {
            await transaction.rollback();
            return generateResponse(404, { message: "Usuario no encontrado" });
        }

        const [[test]] = await transaction.query(
            `SELECT 
                t.passing_score,
                t.sector,
                at.id as assigned_test_id
             FROM tests t
             JOIN assigned_tests at ON t.id = at.test_id
             WHERE t.id = ? AND at.user_id = ?`,
            [test_id, user_id]
        );
        
        if (!test) {
            await transaction.rollback();
            return generateResponse(404, { message: "Test no encontrado o no asignado al usuario" });
        }

        let totalScore = 0;
        let totalWeight = 0;
        const questionIds = responses.map(r => r.question_id);

        const [questions] = await transaction.query(
            `SELECT 
                q.id, 
                q.weight, 
                q.type,
                GROUP_CONCAT(o.id ORDER BY o.id SEPARATOR ',') as correct_options
             FROM questions q
             LEFT JOIN options o ON q.id = o.question_id AND o.is_correct = 1
             WHERE q.test_id = ? AND q.id IN (?)
             GROUP BY q.id`,
            [test_id, questionIds]
        );

        if (questions.length !== responses.length) {
            await transaction.rollback();
            return generateResponse(400, { message: "Algunas preguntas no pertenecen a este test" });
        }

        for (const response of responses) {
            const question = questions.find(q => q.id === response.question_id);
            if (!question) continue;

            const correctOptions = question.correct_options ? question.correct_options.split(',').map(Number) : [];
            const userAnswers = Array.isArray(response.selected_options) ? 
                              response.selected_options.map(Number) : [];

            let isCorrect = false;

            if (question.type === 'simple') {
                isCorrect = userAnswers.length === 1 && 
                           correctOptions.includes(userAnswers[0]);
            } else {
                isCorrect = correctOptions.length === userAnswers.length && 
                           correctOptions.every(id => userAnswers.includes(id));
            }

            if (isCorrect) {
                totalScore += question.weight;
            }
            totalWeight += question.weight;
        }

        const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
        const passed = finalScore >= test.passing_score;
        const newStatus = passed ? "completado" : "reiniciado";

        await transaction.query(
            `UPDATE assigned_tests 
             SET status = ?, 
                 score = ?, 
                 completed_at = ?
             WHERE id = ?`,
            [newStatus, finalScore, getFechaChile(null, true), test.assigned_test_id]
        );

        await transaction.commit();
        
        return generateResponse(200, { 
            message: "Test evaluado", 
            passed, 
            score: finalScore.toFixed(2),
            passing_score: test.passing_score,
            status: newStatus
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error al procesar respuestas del test:", error);
        return generateResponse(500, { message: "Error interno del servidor" });
    }
};
