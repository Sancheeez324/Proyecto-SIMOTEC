const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-2" }); // Configuramos la región en us-east-2
const SES = new AWS.SES();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");

// Función auxiliar para enviar correo usando AWS SES
const sendWelcomeEmail = async (to, password, name = "Usuario") => {
  const params = {
    Source: "no-reply@tudominio.com", // Reemplaza con tu correo verificado en SES
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: { Data: "Bienvenido a Simotec" },
      Body: {
        Text: {
          Data: `Hola ${name},\n\nBienvenido a Simotec. Tu contraseña es: ${password}\n\nSaludos.`,
        },
        Html: {
          Data: `<p>Hola <strong>${name}</strong>,</p>
                 <p>Bienvenido a Simotec. Tu contraseña es: <strong>${password}</strong></p>
                 <p>Saludos.</p>`,
        },
      },
    },
  };

  const result = await SES.sendEmail(params).promise();
  console.log("Correo enviado. MessageId:", result.MessageId);
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
    // cadmin_id es el id del administrador que crea al usuario
    const cadminId = decoded.id;

    // Extraer campos del request body
    const { nombre, rut, fecha_nac, sector, cargo, email, password } = JSON.parse(event.body);
    if (!nombre || !rut || !email || !password) {
      return generateResponse(400, { message: "Missing required fields" });
    }

    // Hashear la contraseña (para almacenarla)
    const password_hash = await bcrypt.hash(password, 10);

    return await queryWithTransaction(async (connection) => {
      // Insertar en la tabla auth_users
      // Usamos la columna "password" y asignamos el user_type como 'user'
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
    const cadminId = decoded.id;

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
