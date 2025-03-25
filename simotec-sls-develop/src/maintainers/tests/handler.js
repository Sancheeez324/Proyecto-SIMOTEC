const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");

// Obtener todos los tests
module.exports.getTests = async (event) => {
    return await queryWithTransaction(async (connection) => {
        const [tests] = await connection.query("SELECT * FROM tests");
        return {
            statusCode: 200,
            body: JSON.stringify(tests),
        };
    });
};

// Asignar test a usuarios
module.exports.assignTest = async (event) => {
    try {
        const { testId, userIds, assignedBy } = JSON.parse(event.body);
        
        console.log("Datos recibidos en assignTest:", { testId, userIds, assignedBy });

        if (!testId || !userIds || userIds.length === 0 || !assignedBy) {
            return generateResponse(400, false, "Faltan datos obligatorios");
        }

        // Obtener datos del test
        const [testData] = await queryWithTransaction(async (connection) => {
            const results = await connection.query(
                "SELECT sector, tipo, passing_score FROM tests WHERE id = ?", 
                [testId]
            );
            return results;
        });

        if (testData.length === 0) {
            return generateResponse(404, false, "El test no existe");
        }

        const { sector: testSector, tipo: testTipo, passing_score } = testData[0];
        const currentDateTime = getFechaChile(undefined, true);

        // Verificar compatibilidad de usuarios
        if (testSector.toLowerCase() !== 'todos' || testTipo.toLowerCase() !== 'todos') {
            const [usersData] = await queryWithTransaction(async (connection) => {
                const results = await connection.query(
                    "SELECT id, sector, cargo FROM users WHERE id IN (?)", 
                    [userIds]
                );
                return results;
            });

            for (const user of usersData) {
                let errorMessage = '';
                
                if (testSector.toLowerCase() !== 'todos' && 
                    testSector.toLowerCase() !== user.sector.toLowerCase()) {
                    errorMessage = `Este test no es para este trabajador por sector (Test: ${testSector}, Usuario: ${user.sector})`;
                }
                
                if (testTipo.toLowerCase() !== 'todos' && 
                    testTipo.toLowerCase() !== user.cargo.toLowerCase()) {
                    errorMessage = errorMessage 
                        ? `${errorMessage} y cargo (Test: ${testTipo}, Usuario: ${user.cargo})`
                        : `Este test no es para este trabajador por cargo (Test: ${testTipo}, Usuario: ${user.cargo})`;
                }

                if (errorMessage) {
                    return generateResponse(400, false, errorMessage);
                }
            }
        }

        // Si pasa las validaciones, proceder con la asignación
        await queryWithTransaction(async (connection) => {
            for (const userId of userIds) {
                await connection.query(
                    "INSERT INTO assigned_tests (user_id, test_id, assigned_by, sector, passing_score, status, start_time, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [userId, testId, assignedBy, testSector, passing_score, "pendiente", currentDateTime, 60]
                );
            }
        });

        return generateResponse(201, true, "Test asignado exitosamente");
    } catch (error) {
        console.error("Error al asignar test:", error);
        return generateResponse(500, false, "Error al asignar test");
    }
};