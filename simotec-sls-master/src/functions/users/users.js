const { generateResponse, getFechaChile } = require("../../utils/utils");
const { queryWithTransaction } = require("../../config/database");
const { validateToken } = require("../../config/auth");
const bcrypt = require("bcryptjs");

module.exports.registerUser = async (event) => {
  try {
    const { cadminId, name, email, password } = JSON.parse(event.body);

    if (!cadminId || !name || !email || !password)
      return generateResponse(400, { message: "Missing data" });

    const date = getFechaChile(null, true);
    const random = Math.floor(Math.random() * (13 - 10)) + 10;
    const salt = await bcrypt.genSalt(random);
    const hash = await bcrypt.hash(password, salt); // hash es el password encriptado
    
    const query = `
      INSERT INTO users (username, email, password, created_at, cadmin_id)VALUES (?, ?, ?, ?, ?)`;

    const result = await queryWithTransaction(async (connection) => {
      const [rows] = await connection.execute(query, [
        name,
        email,
        hash,
        date,
        cadminId,
      ]);
      return rows;
    });

    if (result.affectedRows === 0)
      return generateResponse(400, { message: "User not registered" });

    return generateResponse(201, { message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return generateResponse(500, "Internal Server Error");
  }
};

/**
 * Get all users
 * TODO: Esta funcion debe filtrar por cliente asociado! (empresa cliente aun no definida en modelo.)
 */
module.exports.getUsers = async (event) => {
  try {
    const token = event.headers.authorization;
    const isValid = await validateToken(token);
    if (!isValid) return generateResponse(401, "Unauthorized");

    const cadminId = event.pathParameters.id;
    const query = `SELECT * FROM users where cadmin_id = ?`;
    const result = await queryWithTransaction(async (connection) => {
      const [rows] = await connection.execute(query, [cadminId]);
      return rows;
    });

    if (result.length === 0) return generateResponse(404, "No users found");

    return generateResponse(200, { users: result });
  } catch (error) {
    console.error(error);
    return generateResponse(500, "Internal Server Error");
  }
};

// Funciones que utiliza un usuario en sesion.

// 1 Funcion para obtener tests/evaluaciones pendientes de realizar.
module.exports.getPendingTests = async (event) => {
  try {
    // TODO: validar token

    const userId = event.pathParameters.id;
    const query = `
    SELECT t.test_name AS test, at.passing_score AS puntaje_aprobacion, at.status AS estado
    FROM assigned_tests at
    JOIN tests t ON at.test_id = t.id
    JOIN evaluation_rounds er ON at.evaluation_round_id = er.id
    JOIN evaluation_cycles ec ON er.evaluation_cycle_id = ec.id
    WHERE ec.user_id = ? AND at.status = 'pendiente';
  `;

    const result = await queryWithTransaction(async (connection) => {
      const [rows] = await connection.execute(query, [userId]);
      return rows;
    });

    if (result.length === 0) return generateResponse(404, "No tests pending");

    return generateResponse(200, { pendingTests: result });
  } catch (error) {
    console.error(error);
    return generateResponse(500, "Internal Server Error");
  }
};
