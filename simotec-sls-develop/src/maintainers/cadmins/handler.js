const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");
const bcrypt = require("bcryptjs");


module.exports.listCadmins = async (event) => {
    try {
      return await queryWithTransaction(async (connection) => {
        const query = "SELECT * FROM cadmins";
        const [cadmins] = await connection.execute(query);
        cadmins.forEach((cadmin) => {
          cadmin.created_at = getFechaChile(cadmin.created_at, true);
        });
        return generateResponse(200, { cadmins });
      });
    } catch (error) {
      console.error("Error listing cadmins:", error);
      return generateResponse(500, { message: "Internal Server Error" });
    }
  };
  
  module.exports.createCadmin = async (event) => {
    try {
      const { name, email, password } = JSON.parse(event.body);
      if (!name || !email || !password) {
        return generateResponse(400, { message: "Missing required fields" });
      }
      const password_hash = await bcrypt.hash(password, 10);
      return await queryWithTransaction(async (connection) => {
        await connection.execute(
          "INSERT INTO cadmins (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())",
          [name, email, password_hash]
        );
        return generateResponse(201, { message: "Cadmin created successfully" });
      });
    } catch (error) {
      console.error("Error creating cadmin:", error);
      return generateResponse(500, { message: error.message });
    }
  };
  
  module.exports.editCadmin = async (event) => {
    try {
      const cadminId = event.pathParameters.id;
      const { name, email } = JSON.parse(event.body);
      if (!name || !email) {
        return generateResponse(400, { message: "Missing required fields" });
      }
      return await queryWithTransaction(async (connection) => {
        await connection.execute(
          "UPDATE cadmins SET name = ?, email = ? WHERE id = ?",
          [name, email, cadminId]
        );
        return generateResponse(200, { message: "Cadmin updated successfully" });
      });
    } catch (error) {
      console.error("Error updating cadmin:", error);
      return generateResponse(500, { message: "Internal Server Error" });
    }
  };
  
  module.exports.deleteCadmin = async (event) => {
    try {
      const cadminId = event.pathParameters.id;
      return await queryWithTransaction(async (connection) => {
        await connection.execute("DELETE FROM cadmins WHERE id = ?", [cadminId]);
        return generateResponse(200, { message: "Cadmin deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting cadmin:", error);
      return generateResponse(500, { message: "Internal Server Error" });
    }
  };
  