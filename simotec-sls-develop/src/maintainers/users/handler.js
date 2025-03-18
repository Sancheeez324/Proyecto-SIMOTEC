const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");
const bcrypt = require("bcryptjs");

module.exports.listUsers = async (event) => {
  try {
    console.log("Iniciando listUsers..."); // Log de inicio
    return await queryWithTransaction(async (connection) => {
      console.log("Conexión a la base de datos establecida"); // Log de conexión
      const query = "SELECT * FROM users"; // Seleccionar todos los usuarios
      const [users] = await connection.execute(query);

      console.log("Usuarios obtenidos:", users); // Log de usuarios obtenidos

      users.forEach((user) => {
        user.created_at = getFechaChile(user.created_at, true); // Formatear fecha
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
    const { rut, nombre, email, password, sector, cargo, cadmin_id } = JSON.parse(event.body);

    console.log("Datos recibidos en el backend:", {
      rut,
      nombre,
      email,
      password,
      sector,
      cargo,
      cadmin_id,
    });

    // Validar campos requeridos
    const requiredFields = { rut, nombre, email, password, sector, cargo, cadmin_id };
    const missingFields = Object.keys(requiredFields).filter((key) => !requiredFields[key]);

    if (missingFields.length > 0) {
      console.log("Faltan los siguientes campos:", missingFields);
      return generateResponse(400, {
        message: "Missing required fields",
        missingFields,
      });
    }

    // Hashear la contraseña
    const password_hash = await bcrypt.hash(password, 10);

    return await queryWithTransaction(async (connection) => {
      // 1️⃣ Insertar en `auth_users`
      const [authResult] = await connection.execute(
        "INSERT INTO auth_users (email, password, user_type, created_at) VALUES (?, ?, 'user', NOW())",
        [email, password_hash]
      );

      const auth_user_id = authResult.insertId; // Obtener el ID generado

      // 2️⃣ Insertar en `users`
      await connection.execute(
        "INSERT INTO users (auth_user_id, rut, nombre, sector, cargo, cadmin_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [auth_user_id, rut, nombre, sector, cargo, cadmin_id]
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

module.exports.getDashboardStats = async (event) => {
  try {
    // Determinar qué estadística está solicitando basado en el path
    const path = event.path;
    const isUserCount = path.includes('/regular-users/count');
    const isTestCount = path.includes('/assigned-tests/count');
    
    // Extraer el ID del usuario autenticado del contexto de autorización
    const authUserId = event.requestContext.authorizer.principalId; // Ajusta según cómo guardas el ID en el token

    return await queryWithTransaction(async (connection) => {
      // Obtener primero el cadmin_id
      const [cadminResult] = await connection.execute(
        'SELECT id FROM cadmins WHERE auth_user_id = ?',
        [authUserId]
      );
      
      if (!cadminResult || cadminResult.length === 0) {
        return generateResponse(404, { message: 'Administrador de empresa no encontrado' });
      }
      
      const cadminId = cadminResult[0].id;
      
      if (isUserCount) {
        // Contar SOLO usuarios regulares que pertenecen a este cadmin
        const [usersCount] = await connection.execute(
          'SELECT COUNT(*) as count FROM users WHERE cadmin_id = ?',
          [cadminId]
        );
        
        return generateResponse(200, { count: usersCount[0].count });
      } 
      else if (isTestCount) {
        // Contar tests asignados por este cadmin
        const [testsCount] = await connection.execute(
          `SELECT COUNT(*) as count FROM assigned_tests 
           WHERE assigned_by = ?`,
          [cadminId]
        );
        
        return generateResponse(200, { count: testsCount[0].count });
      } 
      else {
        return generateResponse(400, { message: 'Endpoint no reconocido' });
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    return generateResponse(500, { message: 'Error interno del servidor', error: error.message });
  }
};