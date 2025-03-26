const db = require("../../config/database");
const { generateResponse, getFechaChile, parseEventBody } = require("../../utils/utils");

// 1. Obtener tests asignados a un usuario
module.exports.getAssignedTests = async (event) => {
    try {
        const { user_id } = event.pathParameters;
        
        if (!user_id || isNaN(user_id)) {
            return generateResponse(400, { message: "ID de usuario inválido" });
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

// 2. Obtener preguntas y opciones de un test
module.exports.getTestQuestions = async (event) => {
    try {
        const test_id = event.pathParameters?.test_id || event.pathParameters?.['test_id'];        console.log("Test recibido ", test_id);
        if (!test_id || isNaN(test_id)) {
            return generateResponse(400, { message: "ID de test inválido" });
        }

        const [[testExists]] = await db.query(
            "SELECT id FROM tests WHERE id = ?",
            [test_id]
        );
        
        if (!testExists) {
            return generateResponse(404, { message: "Test no encontrado" });
        }

        const [questions] = await db.query(
            `SELECT 
                q.id, 
                q.question_text, 
                q.type, 
                q.sector, 
                q.weight, 
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
             WHERE q.test_id = ?
             GROUP BY q.id
             ORDER BY q.id`,
            [test_id]
        );
        
        if (questions.length === 0) {
            return generateResponse(404, { message: "No se encontraron preguntas para este test" });
        }

        const sanitizedQuestions = questions.map(question => {
            question.options = question.options.map(option => {
                const { is_correct, ...rest } = option;
                return rest;
            });
            return question;
        });

        return generateResponse(200, sanitizedQuestions);
    } catch (error) {
        console.error("Error al obtener preguntas del test:", error);
        return generateResponse(500, { message: "Error interno del servidor" });
    }
};

// 3. Enviar respuestas del test
module.exports.submitTest = async (event) => {
    const transaction = await db.beginTransaction();
    try {
        const { test_id } = event.pathParameters;
        const { user_id, responses } = parseEventBody(event);

        if (!user_id || !responses || !Array.isArray(responses)) {
            await transaction.rollback();
            return generateResponse(400, { message: "Datos de entrada inválidos" });
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

// 4. Actualizar estado del test asignado
module.exports.updateTestStatus = async (event) => {
    const transaction = await db.beginTransaction();
    try {
        const { assigned_test_id } = event.pathParameters;
        const { status } = parseEventBody(event);

        const allowedStatuses = ['pendiente', 'completado', 'reiniciado'];
        if (!allowedStatuses.includes(status)) {
            await transaction.rollback();
            return generateResponse(400, { message: "Estado no válido" });
        }

        const [result] = await transaction.query(
            `UPDATE assigned_tests 
             SET status = ?,
                 start_time = IF(status = 'pendiente' AND ? = 'reiniciado', ?, start_time)
             WHERE id = ?`,
            [status, status, getFechaChile(null, true), assigned_test_id]
        );

        if (result.affectedRows === 0) {
            await transaction.rollback();
            return generateResponse(404, { message: "Test asignado no encontrado" });
        }

        await transaction.commit();
        return generateResponse(200, { message: "Estado del test actualizado" });
    } catch (error) {
        await transaction.rollback();
        console.error("Error al actualizar estado del test:", error);
        return generateResponse(500, { message: "Error interno del servidor" });
    }
};