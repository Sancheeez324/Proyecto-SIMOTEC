const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports.listUsers = async (event) => {
  try {
    console.log("🔍 Iniciando listUsers...");

    // Extraer y decodificar el token del header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Token no proporcionado");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      throw new Error("Token inválido");
    }

    const authUserId = decoded.id;

    return await queryWithTransaction(async (connection) => {
      console.log("📡 Conexión a la base de datos establecida");

      // Obtener usuarios asociados al `cadmin_id` con email desde auth_users
      const query = `
        SELECT 
          users.id, 
          users.rut, 
          users.nombre, 
          users.fecha_nac, 
          users.sector, 
          users.cargo, 
          users.created_at,
          auth_users.email  -- Se agrega el email desde auth_users
        FROM users 
        JOIN auth_users ON users.auth_user_id = auth_users.id  -- Unimos con auth_users
        WHERE users.cadmin_id = ?
      `;
      const [users] = await connection.execute(query, [authUserId]);

      console.log("👥 Usuarios obtenidos con email:", users);

      users.forEach((user) => {
        user.created_at = getFechaChile(user.created_at, true);
      });

      return generateResponse(200, { users });
    });
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error);
    return generateResponse(500, { message: error.message || "Internal Server Error" });
  }
};
