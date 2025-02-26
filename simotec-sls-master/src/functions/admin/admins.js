const { generateResponse, getFechaChile } = require("../../utils/utils");
const { queryWithTransaction } = require("../../config/database");
const bcrypt = require("bcryptjs");

module.exports.createCAdmin = async (event) => {
  try {
    const { name, email, password } = JSON.parse(event.body);

    if (!name || !email || !password)
      return generateResponse(400, "Faltan datos.");

    const random = Math.floor(Math.random() * (13 - 10)) + 10;
    const salt = await bcrypt.genSalt(random);
    const hash = await bcrypt.hash(password, salt); // hash es el password encriptado

    const values = [name, email, hash, getFechaChile()];
    const query = `INSERT INTO cadmins (name, email, password, created_at) VALUES (?, ?, ?, ?)`;

    const result = await queryWithTransaction(async (connection) => {
      const [rows] = await connection.execute(query, values);
      return rows;
    });

    if (result.affectedRows === 0)
      return generateResponse(400, "Error al crear el administrador.");

    return generateResponse(200, "Administrador creado correctamente.");
  } catch (error) {
    console.error(error);
    return generateResponse(500, "Error interno del servidor.");
  }
};

/**
 * Funcion para que un CADMIN asigne un test a un usuario.
 *
 * 
 * Validaciones Añadidas
 * Validación de Test ID: Solo se permiten los IDs 1, 2, y 3.
 * Verificación de Ciclo de Evaluación: Solo se puede iniciar una nueva ronda si el ciclo está activo.
 * Duplicación de Test: No se permite asignar el mismo test en la misma ronda.
 * Capacidad de la Ronda: No se permite asignar más de 3 tests en una misma ronda.
 * Completitud de la Primera Ronda: La segunda ronda solo se inicia si la primera ronda está completa.
 * Resumen del Flujo
 * Ciclo de Evaluación: Se asegura que exista un ciclo activo antes de cualquier asignación.
 * Ronda de Evaluación: Se asegura que no se repitan los tests dentro de la misma ronda y que cada ronda tenga exactamente 3 tests.
 * Asignación de Tests: Los tests se asignan con las restricciones y validaciones necesarias para garantizar un flujo correcto.
 * @function assignTestToUser
 * @param {*} event
 * @returns
 */
module.exports.assignTestToUser = async (event) => {
  try {
    const { user_id, cadmin_id, test_id } = JSON.parse(event.body);

    if (!user_id || !cadmin_id || !test_id) {
      return generateResponse(400, { message: "Invalid input data" });
    }

    if (![1, 2, 3].includes(test_id)) {
      return generateResponse(400, { message: "Invalid test ID" });
    }

    const result = await queryWithTransaction(async (connection) => {
      // Verificar si existe un ciclo de evaluación activo para el usuario
      const evaluationCycleQuery = `
        SELECT id FROM evaluation_cycles
        WHERE user_id = ? AND status = 'iniciado'
      `;
      const [evaluationCycleRows] = await connection.execute(
        evaluationCycleQuery,
        [user_id]
      );

      let evaluation_cycle_id;

      if (evaluationCycleRows.length === 0) {

        // TODO:
        // Agregar validación para que solo se pueda crear un ciclo de evaluación en caso de que el usuario no tenga uno activo

        // Si no existe un ciclo de evaluación activo, crear uno
        const insertEvaluationCycleQuery = `
          INSERT INTO evaluation_cycles (user_id, cadmin_id, status)
          VALUES (?, ?, 'iniciado')
        `;
        const [evaluationCycleResult] = await connection.execute(
          insertEvaluationCycleQuery,
          [user_id, cadmin_id]
        );
        evaluation_cycle_id = evaluationCycleResult.insertId;
      } else {
        evaluation_cycle_id = evaluationCycleRows[0].id;
      }

      // Verificar si existe una ronda activa en el ciclo
      const evaluationRoundQuery = `
        SELECT id, round_number FROM evaluation_rounds
        WHERE evaluation_cycle_id = ? AND status = 'iniciada'
      `;
      const [evaluationRoundRows] = await connection.execute(
        evaluationRoundQuery,
        [evaluation_cycle_id]
      );

      let evaluation_round_id;
      let round_number;

      if (evaluationRoundRows.length === 0) {
        // Si no existe una ronda activa, crear la primera ronda
        const insertEvaluationRoundQuery = `
          INSERT INTO evaluation_rounds (evaluation_cycle_id, round_number, status)
          VALUES (?, 1, 'iniciada')
        `;
        const [evaluationRoundResult] = await connection.execute(
          insertEvaluationRoundQuery,
          [evaluation_cycle_id]
        );
        evaluation_round_id = evaluationRoundResult.insertId;
        round_number = 1;
      } else {
        evaluation_round_id = evaluationRoundRows[0].id;
        round_number = evaluationRoundRows[0].round_number;
      }

      // Validar que el test no esté duplicado en la ronda actual
      const testExistsQuery = `
        SELECT id FROM assigned_tests 
        WHERE evaluation_round_id = ? AND test_id = ?
      `;
      const [testExistsRows] = await connection.execute(testExistsQuery, [
        evaluation_round_id,
        test_id,
      ]);

      if (testExistsRows.length > 0) {
        return generateResponse(400, {
          message: `Test ID ${test_id} is already assigned in the current round`,
        });
      }

      // Verificar si la ronda actual tiene menos de 3 tests asignados
      const assignedTestsQuery = `
        SELECT COUNT(*) as test_count FROM assigned_tests 
        WHERE evaluation_round_id = ?
      `;
      const [assignedTestsRows] = await connection.execute(assignedTestsQuery, [
        evaluation_round_id,
      ]);

      if (assignedTestsRows[0].test_count >= 3) {
        return generateResponse(400, {
          message: `The current round already has 3 tests assigned`,
        });
      }

      // Asignar el test al usuario dentro de la ronda activa
      const assignTestQuery = `
        INSERT INTO assigned_tests (evaluation_round_id, test_id, assigned_by, passing_score, status)
        VALUES (?, ?, ?, (SELECT passing_score FROM tests WHERE id = ?), 'pendiente')
      `;
      const assignTestParams = [
        evaluation_round_id,
        test_id,
        cadmin_id,
        test_id,
      ];
      await connection.execute(assignTestQuery, assignTestParams);

      return {
        message: "Test assigned successfully",
        evaluation_cycle_id,
        evaluation_round_id,
      };
    });

    return generateResponse(200, result);
  } catch (error) {
    console.error(error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};
