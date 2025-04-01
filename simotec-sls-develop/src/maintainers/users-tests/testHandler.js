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