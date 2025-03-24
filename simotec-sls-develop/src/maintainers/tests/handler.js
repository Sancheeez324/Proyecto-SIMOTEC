const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");

// Obtener todos los tests
module.exports.getTests = async (event) => {
    return await queryWithTransaction(async (connection) => {
        const [tests] = await connection.query("SELECT * FROM tests"); // ⬅ Extraemos solo los datos
        return {
            statusCode: 200,
            body: JSON.stringify(tests), // Ahora solo enviamos el array de tests
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
  
      const testData = await queryWithTransaction(async (connection) => {
        const results = await connection.query("SELECT sector, passing_score FROM tests WHERE id = ?", [testId]);
        return results;
      });
        
      if (testData.length === 0) {
        return generateResponse(404, false, "El test no existe");
      }
  
      const { sector, passing_score } = testData[0];
      const currentDateTime = getFechaChile();
  
      await queryWithTransaction(async (connection) => {
        for (const userId of userIds) {
          await connection.query(
            "INSERT INTO assigned_tests (user_id, test_id, assigned_by, sector, passing_score, status, start_time, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [userId, testId, assignedBy, sector, passing_score, "pendiente", currentDateTime, 60]
          );
        }
      });
  
      return generateResponse(201, true, "Test asignado exitosamente");
    } catch (error) {
      console.error("Error al asignar test:", error);
      return generateResponse(500, false, "Error al asignar test");
    }
  };