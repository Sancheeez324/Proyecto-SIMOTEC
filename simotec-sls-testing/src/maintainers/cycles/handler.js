const { queryWithTransaction } = require("../../config/database");
const { generateResponse } = require("../../utils/utils");
const { validateToken } = require("../../config/auth");

// TODO:
// Considerar la opcion de que la criteria pueda ser aplicada para algunos usuarios y/o para todos ⚠️⚠️⚠️⚠️⚠️
module.exports.createEvaluationCycle = async (event) => {
  try {
    // Obtener y validar los datos de la solicitud
    const { company_id, start_date, end_date, criteria, user_ids } = JSON.parse(
      event.body
    );

    if (!company_id || !start_date || !user_ids || user_ids.length === 0) {
      return generateResponse(400, {
        message: "Company ID, start date, and user IDs are required",
      });
    }

    // Validar que el usuario tenga el rol de `compania_admin`
    const token = event.headers["authorization"];
    const userData = await validateToken(token, ["compania_admin"]);

    return await queryWithTransaction(async (connection) => {
      // Verificar si el usuario tiene acceso a la compañía especificada
      // para esto obtner el usuario de la bd por el id del token
      const [users] = await connection.execute(
        "SELECT * FROM users WHERE id = ?",
        [userData.id]
      );
      if (users.length === 0) {
        return generateResponse(401, { message: "Invalid user" });
      }
      const user = users[0];
      if (user.company_id !== company_id) {
        return generateResponse(403, {
          message: "Unauthorized access to the specified company",
        });
      }

      // Crear el ciclo de evaluación
      const [result] = await connection.execute(
        "INSERT INTO evaluation_cycles (company_id, start_date, end_date, status, created_at) VALUES (?, ?, ?, 'active', NOW())",
        [company_id, start_date, end_date]
      );
      const cycleId = result.insertId;

      // Obtener los puntajes por defecto para todos los tests en la base de datos
      const [defaultTests] = await connection.execute(
        "SELECT id, passing_score FROM tests"
      );
      const defaultScores = {};
      defaultTests.forEach((test) => {
        defaultScores[test.id] = test.passing_score;
      });

      // Asignar rondas y tests al ciclo, basándose en los criterios opcionales enviados en `criteria`
      for (let roundNumber = 1; roundNumber <= 3; roundNumber++) {
        const [roundResult] = await connection.execute(
          "INSERT INTO rounds (evaluation_cycle_id, round_number, status, created_at) VALUES (?, ?, 'pending', NOW())",
          [cycleId, roundNumber]
        );
        const roundId = roundResult.insertId;

        // Obtener el criterio especificado para la ronda actual, si existe
        const roundCriteria = criteria?.find(
          (r) => r.round_number === roundNumber
        );

        // Crear los criterios de evaluación para cada test (usando valores de `criteria` si están presentes)
        for (const testId of Object.keys(defaultScores)) {
          const testCriteria = roundCriteria?.tests.find(
            (t) => t.test_id === Number(testId)
          );
          const passingScore = testCriteria
            ? testCriteria.passing_score
            : defaultScores[testId];

          await connection.execute(
            "INSERT INTO evaluation_criteria (evaluation_cycle_id, test_id, round_id, passing_score) VALUES (?, ?, ?, ?)",
            [cycleId, testId, roundId, passingScore]
          );

          // Asignar el test solo a los usuarios seleccionados en `user_ids`
          for (const userId of user_ids) {
            await connection.execute(
              "INSERT INTO assigned_tests (round_id, user_id, test_id, status, score, created_at) VALUES (?, ?, ?, 'pending', 0, NOW())",
              [roundId, userId, testId]
            );
          }
        }
      }

      // Retornar la confirmación del ciclo creado
      return generateResponse(201, {
        message: "Evaluation cycle created successfully",
        cycle_id: cycleId,
        assigned_users: user_ids,
      });
    });
  } catch (error) {
    console.error("Error creating evaluation cycle:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};
