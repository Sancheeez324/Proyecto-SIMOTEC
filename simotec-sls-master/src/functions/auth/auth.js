const { generateResponse } = require("../../utils/utils");
const { queryWithTransaction } = require("../../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports.login = async (event) => {
  try {
    const { email, password, type } = JSON.parse(event.body);

    console.debug("DEBUG: email, password, type", email, password, type);

    if (!email || !password || !type) {
      return generateResponse(400, { message: "Missing data" });
    }
    // si es type=admin, buscar en la tabla cadmins. si es type=user, buscar en la tabla users
    const table = type === "admin" ? "cadmins" : "users";
    const query = `SELECT * FROM ${table} WHERE email = ?`;

    const result = await queryWithTransaction(async (connection) => {
      const [rows] = await connection.execute(query, [email]);
      if (rows.length === 0) {
        return [];
      }
      const userPassword = rows[0].password;
      const validPassword = await bcrypt.compare(password, userPassword);

      if (!validPassword) {
        return [];
      }

      const token = jwt.sign({ email, type }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      //  Actualizar el token al usuario | cadmin en la base de datos
      const updateTokenQuery = `UPDATE ${table} SET token = ? WHERE email = ?`;
      await connection.execute(updateTokenQuery, [token, email]);

      return rows.map((row) => {
        delete row.password;
        return { ...row, token };
      });
    });

    if (result.length === 0) {
      return generateResponse(401, { message: "Invalid email or password" });
    }

    return generateResponse(200, {
      token: result[0].token,
      user: result[0],
      type,
    });
  } catch (error) {
    console.error(error);
    return generateResponse(
      500,
      error.message ? error.message : "Error interno del servidor."
    );
  }
};
