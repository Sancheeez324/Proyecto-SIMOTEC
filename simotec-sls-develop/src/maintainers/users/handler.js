const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");
const bcrypt = require("bcryptjs");

module.exports.listUsers = async (event) => {
  try {
    const { company_id } = event.queryStringParameters || {};

    return await queryWithTransaction(async (connection) => {
      const filterQuery = company_id ? "WHERE company_id = ?" : "";
      const filterParams = company_id ? [company_id] : [];

      const query = `SELECT * FROM users ${filterQuery}`;
      const [users] = await connection.execute(query, filterParams);

      users.forEach((user) => {
        user.created_at = getFechaChile(user.created_at, true);
      });

      return generateResponse(200, { users });
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.createUser = async (event) => {
  try {
    const { name, email, password, company_id } = JSON.parse(event.body);
    if (!name || !email || !password) {
      return generateResponse(400, { message: "Missing required fields" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    return await queryWithTransaction(async (connection) => {
      await connection.execute(
        "INSERT INTO users (name, email, password_hash, company_id, created_at) VALUES (?, ?, ?, ?, NOW())",
        [name, email, password_hash, company_id]
      );
      return generateResponse(201, { message: "User created successfully" });
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return generateResponse(500, { message: error.message });
  }
};

module.exports.editUser = async (event) => {
  try {
    const userId = event.pathParameters.id;
    const { name, email, company_id } = JSON.parse(event.body);
    if (!name || !email) {
      return generateResponse(400, { message: "Missing required fields" });
    }

    return await queryWithTransaction(async (connection) => {
      await connection.execute(
        "UPDATE users SET name = ?, email = ?, company_id = ? WHERE id = ?",
        [name, email, company_id, userId]
      );
      return generateResponse(200, { message: "User updated successfully" });
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.deleteUser = async (event) => {
  try {
    const userId = event.pathParameters.id;
    return await queryWithTransaction(async (connection) => {
      await connection.execute("DELETE FROM users WHERE id = ?", [userId]);
      return generateResponse(200, { message: "User deleted successfully" });
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};