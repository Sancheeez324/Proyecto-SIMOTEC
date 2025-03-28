const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");

// Configurar el transporte de NodeMailer usando Gmail (modifica según tus credenciales)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "registro.simotec@gmail.com", // Tu correo verificado
    pass: "vadc fxtn meal awsp",      // Contraseña de aplicación de Gmail
  },
});

// Función auxiliar para enviar correo usando NodeMailer
const sendWelcomeEmail = async (to, password, name = "Usuario") => {
  const mailOptions = {
    from: '"Simotec" <registro.simotec@gmail.com>',
    to: to,
    subject: "Bienvenido a Simotec",
    text: `Hola ${name},\n\nBienvenido a Simotec. Su contraseña para la plataforma de SEGURIDAD SIMOTEC es: ${password}\n\nSaludos.`,
    html: `<p>Hola <strong>${name}</strong>,</p>
           <p>Bienvenido a Simotec. Su contraseña para la plataforma de <strong>SEGURIDAD SIMOTEC</strong> es: <strong>${password}</strong></p>
           <p>Saludos.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Correo enviado con éxito. MessageId:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    throw new Error("No se pudo enviar el correo");
  }
};

// Handler para crear usuario y enviar correo
module.exports.createUser = async (event) => {
  try {
    console.log("🔍 Iniciando createUser...");

    // Validar el token del header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Token no proporcionado");
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      throw new Error("Token inválido");
    }
    // cadmin_id es el id del administrador que crea al usuario (usar decoded.authId según la lógica de tu app)
    const cadminId = decoded.authId;

    // Extraer campos del request body
    const { nombre, rut, fecha_nac, sector, cargo, email, password } = JSON.parse(event.body);
    if (!nombre || !rut || !email || !password) {
      return generateResponse(400, { message: "Missing required fields" });
    }

    // Hashear la contraseña (para almacenarla)
    const password_hash = await bcrypt.hash(password, 10);

    return await queryWithTransaction(async (connection) => {
      // Insertar en la tabla auth_users
      const [resultAuth] = await connection.execute(
        `INSERT INTO auth_users (email, password, user_type, created_at) VALUES (?, ?, 'user', NOW())`,
        [email, password_hash]
      );

      // Insertar en la tabla users, vinculando con auth_users
      const [resultUser] = await connection.execute(
        `INSERT INTO users (rut, nombre, fecha_nac, sector, cargo, auth_user_id, cadmin_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [rut, nombre, fecha_nac, sector, cargo, resultAuth.insertId, cadminId]
      );

      console.log("✅ Usuario creado en la BD con ID:", resultUser.insertId);

      // Enviar el correo de bienvenida con la contraseña en texto plano
      await sendWelcomeEmail(email, password, nombre);

      return generateResponse(201, { message: "User created successfully" });
    });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    return generateResponse(500, { message: error.message });
  }
};

// Handler para listar usuarios (filtrando por cadmin_id)
module.exports.listUsers = async (event) => {
  try {
    console.log("🔍 Iniciando listUsers...");

    // Validar y decodificar token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Token no proporcionado");
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      throw new Error("Token inválido");
    }
    const cadminId = decoded.authId;

    console.log("Consultando usuarios con cadmin_id =", cadminId);

    return await queryWithTransaction(async (connection) => {
      console.log("📡 Conexión a la base de datos establecida");
      const query = `
        SELECT 
          users.id, 
          users.rut, 
          users.nombre, 
          users.fecha_nac, 
          users.sector, 
          users.cargo, 
          users.created_at,
          auth_users.email
        FROM users 
        JOIN auth_users ON users.auth_user_id = auth_users.id
        WHERE users.cadmin_id = ?
      `;
      const [rows] = await connection.execute(query, [cadminId]);
      rows.forEach((user) => {
        user.created_at = getFechaChile(user.created_at, true);
      });

      console.log("👥 Usuarios obtenidos:", rows);

      return generateResponse(200, { users: rows });
    });
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error);
    return generateResponse(500, { message: error.message || "Internal Server Error" });
  }
};
//Lista todos los usuarios
module.exports.listAllUsers = async (event) => {
  try {
    console.log("🔍 Iniciando listAllUsers...");

    // Validar y decodificar token (requiere permisos de admin)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Token no proporcionado");
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario tenga permisos de administrador

    /*
    if (!decoded || !decoded.role || decoded.role !== 'admin') {
          throw new Error("No autorizado: Se requieren permisos de administrador");
        }
    */
    

    console.log("Consultando TODOS los usuarios");

    return await queryWithTransaction(async (connection) => {
      console.log("📡 Conexión a la base de datos establecida");
      const query = `
        SELECT 
          users.id, 
          users.rut, 
          users.nombre, 
          users.fecha_nac, 
          users.sector, 
          users.cargo, 
          users.created_at,
          users.cadmin_id,
          auth_users.email,
          auth_users.user_type
        FROM users 
        JOIN auth_users ON users.auth_user_id = auth_users.id
        ORDER BY users.created_at DESC
      `;
      
      const [rows] = await connection.execute(query);
      
      // Formatear fechas
      const users = rows.map(user => ({
        ...user,
        created_at: getFechaChile(user.created_at, true),
        cadmin_id: user.cadmin_id || 'N/A'
      }));

      console.log(`👥 Total de usuarios obtenidos: ${users.length}`);

      return generateResponse(200, { 
        success: true,
        count: users.length,
        users 
      });
    });
  } catch (error) {
    console.error("❌ Error al listar todos los usuarios:", error);
    return generateResponse(error.message.includes('autorizado') ? 403 : 500, { 
      success: false,
      message: error.message || "Internal Server Error" 
    });
  }
};

// Handler para editar usuario
module.exports.editUser = async (event) => {
  try {
    console.log("🔍 Iniciando editUser...");
    
    // Validar el token del header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return generateResponse(401, { message: "Token no proporcionado" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return generateResponse(401, { message: "Token inválido" });
    }
    
    // Obtener el ID del usuario a editar desde los path parameters
    const userId = event.pathParameters.id;
    
    // Extraer campos del request body
    const { nombre, rut, fecha_nac, sector, cargo, email } = JSON.parse(event.body);
    
    return await queryWithTransaction(async (connection) => {
      // Primero verificamos que el usuario pertenezca al cadmin actual
      const [userCheck] = await connection.execute(
        `SELECT auth_user_id FROM users WHERE id = ? AND cadmin_id = ?`,
        [userId, decoded.authId]
      );
      
      if (userCheck.length === 0) {
        return generateResponse(404, { message: "Usuario no encontrado o no autorizado" });
      }
      
      const authUserId = userCheck[0].auth_user_id;
      
      // Actualizar datos en la tabla users
      await connection.execute(
        `UPDATE users SET 
          nombre = COALESCE(?, nombre),
          rut = COALESCE(?, rut),
          fecha_nac = COALESCE(?, fecha_nac),
          sector = COALESCE(?, sector),
          cargo = COALESCE(?, cargo),
          created_at = NOW()
         WHERE id = ?`,
        [nombre, rut, fecha_nac, sector, cargo, userId]
      );
      
      // Actualizar email en auth_users si se proporciona
      if (email) {
        await connection.execute(
          `UPDATE auth_users SET email = ?, created_at = NOW() WHERE id = ?`,
          [email, authUserId]
        );
      }
      
      console.log("✅ Usuario actualizado con ID:", userId);
      return generateResponse(200, { message: "Usuario actualizado correctamente" });
    });
  } catch (error) {
    console.error("❌ Error actualizando usuario:", error);
    return generateResponse(500, { message: error.message || "Error interno del servidor" });
  }
};

// Handler para eliminar usuario
module.exports.deleteUser = async (event) => {
  try {
    console.log("🔍 Iniciando deleteUser...");
    
    // Validar el token del header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return generateResponse(401, { message: "Token no proporcionado" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return generateResponse(401, { message: "Token inválido" });
    }
    
    // Obtener el ID del usuario a eliminar desde los path parameters
    const userId = event.pathParameters.id;
    console.log("Ids del usuario a eliminar ", userId, "y ", decoded.authId);
    return await queryWithTransaction(async (connection) => {
      // Primero verificamos que el usuario pertenezca al cadmin actual y obtenemos su auth_user_id
      const [userCheck] = await connection.execute(
        `SELECT auth_user_id FROM users WHERE id = ? AND cadmin_id = ?`,
        [userId, decoded.authId]
      );
      
      if (userCheck.length === 0) {
        return generateResponse(404, { message: "Usuario no encontrado o no autorizado" });
      }
      
      const authUserId = userCheck[0].auth_user_id;
      
      // Eliminamos primero de la tabla users (para mantener integridad referencial)
      await connection.execute(`DELETE FROM users WHERE id = ?`, [userId]);
      
      // Luego eliminamos de auth_users
      await connection.execute(`DELETE FROM auth_users WHERE id = ?`, [authUserId]);
      
      console.log("✅ Usuario eliminado con ID:", userId);
      return generateResponse(200, { message: "Usuario eliminado correctamente" });
    });
  } catch (error) {
    console.error("❌ Error eliminando usuario:", error);
    return generateResponse(500, { message: error.message || "Error interno del servidor" });
  }
};

// Handler para obtener estadísticas del dashboard
module.exports.getDashboardStats = async (event) => {
  try {
    console.log("🔍 Iniciando getDashboardStats...");
    console.log("Path: ", event.path || event.rawPath);

    // Validar y decodificar token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return generateResponse(401, { message: "Token no proporcionado" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return generateResponse(401, { message: "Token inválido" });
      }
      
      const cadminId = decoded.authId;
      
      // Obtener la ruta para determinar qué acción realizar
      const path = event.path || event.rawPath || '';

      if (path.includes('/dashboard/regular-users/count')) {
        return await queryWithTransaction(async (connection) => {
          console.log("📡 Contando usuarios regulares para cadmin_id:", cadminId);
          const query = `
            SELECT COUNT(*) as count
            FROM users 
            WHERE cadmin_id = ?
          `;
          
          const [rows] = await connection.execute(query, [cadminId]);
          const count = rows[0].count;

          console.log("🔢 Total de usuarios regulares:", count);
          return generateResponse(200, { count });
        });
      } 
      else if (path.includes('/dashboard/assigned-tests/count')) {
        return await queryWithTransaction(async (connection) => {
          console.log("📡 Contando tests asignados para cadmin_id:", cadminId);
          const query = `
            SELECT COUNT(*) as count
            FROM users_tests 
            JOIN users ON users_tests.user_id = users.id
            WHERE users.cadmin_id = ?
          `;
          
          const [rows] = await connection.execute(query, [cadminId]);
          const count = rows[0].count;

          console.log("🔢 Total de tests asignados:", count);
          return generateResponse(200, { count });
        });
      }
      else {
        console.log("❌ Endpoint no reconocido:", path);
        return generateResponse(400, { message: "Endpoint no válido" });
      }
    } catch (jwtError) {
      console.error("❌ Error al verificar token:", jwtError);
      return generateResponse(401, { message: "Token inválido o expirado" });
    }
  } catch (error) {
    console.error("❌ Error en getDashboardStats:", error);
    return generateResponse(500, { message: error.message || "Error interno del servidor" });
  }
};
