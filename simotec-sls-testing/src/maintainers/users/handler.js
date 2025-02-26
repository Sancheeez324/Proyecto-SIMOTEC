const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");
const { validateToken } = require("../../config/auth");
const bcrypt = require("bcryptjs");

module.exports.listUsers = async (event) => {
  try {
    const { role, company_id } = event.queryStringParameters || {};

    return await queryWithTransaction(async (connection) => {
      const filterQuery = [];
      const filterParams = [];

      if (role) {
        filterQuery.push("role = ?");
        filterParams.push(role);
      }
      if (company_id) {
        filterQuery.push("company_id = ?");
        filterParams.push(company_id);
      }

      // SELECT id, name, email, role, company_id FROM users
      const query = `
        SELECT * FROM users 
        ${filterQuery.length > 0 ? "WHERE " + filterQuery.join(" AND ") : ""}
      `;

      const [users] = await connection.execute(query, filterParams);

      // formatear la fecha de creación
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

// TODO: ⚠️
// Agregar validacion al rol recibido para asignar al nuevo usuario.
// EN NINGUN CASO UN USUARIO DEL SISTEMA PUEDE CREAR OTRO USUARIO CON ROL: admin
// ESE TIPO DE USUARIO SOLO ESTA DISPONIBLE PARA EL ADMINISTRADOR DEL SISTEMA.
module.exports.createUser = async (event) => {
  try {
    let password_hash;

    // Obtener el token de los headers (Bearer Token)
    // const token = event.headers["authorization"];

    // if (!token) {
    //   return generateResponse(401, { message: "No token provided" });
    // }

    // // Validar el token y requerir que el rol sea 'admin'
    // await validateToken(token, "admin");

    // Proceso de creación de usuario si el token es válido y tiene los permisos correctos
    const { name, email, password, role, company_id } = JSON.parse(event.body);

    if (!name || !email || !password || !role) {
      return generateResponse(400, { message: "Missing required fields" });
    }

    // Encriptar la contraseña
    password_hash = await bcrypt.hash(password, 10);

    return await queryWithTransaction(async (connection) => {
      // Crear el usuario en la base de datos
      await connection.execute(
        "INSERT INTO users (name, email, password_hash, role, company_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [name, email, password_hash, role, company_id]
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
    const userId = event.pathParameters.userId;
    const { name, email, role, company_id } = JSON.parse(event.body);

    if (!name || !email || !role) {
      return generateResponse(400, { message: "Missing required fields" });
    }

    return await queryWithTransaction(async (connection) => {
      // Verificar número de admins si el rol es compania_admin
      if (role === "compania_admin") {
        const adminCount = await countAdminsForEdit(
          connection,
          company_id,
          userId
        );
        if (adminCount >= 3) {
          return generateResponse(400, {
            message: "Company already has 3 admins",
          });
        }
      }

      // Actualizar el usuario
      await connection.execute(
        "UPDATE users SET name = ?, email = ?, role = ?, company_id = ? WHERE id = ?",
        [name, email, role, company_id, userId]
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
    const userId = event.pathParameters.userId;

    return await queryWithTransaction(async (connection) => {
      // Eliminar usuario
      await connection.execute("DELETE FROM users WHERE id = ?", [userId]);

      return generateResponse(200, { message: "User deleted successfully" });
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

// ##################################################################
// ###################### Funciones auxiliares ######################
// ##################################################################

// Función auxiliar para contar admins
const countAdmins = async (connection, company_id) => {
  const [rows] = await connection.execute(
    'SELECT COUNT(*) AS admin_count FROM users WHERE company_id = ? AND role = "compania_admin"',
    [company_id]
  );
  return rows[0].admin_count;
};

const countAdminsForEdit = async (connection, company_id, userId) => {
  const [rows] = await connection.execute(
    'SELECT COUNT(*) AS admin_count FROM users WHERE company_id = ? AND role = "compania_admin" AND id <> ?',
    [company_id, userId]
  );
  return rows[0].admin_count;
};
