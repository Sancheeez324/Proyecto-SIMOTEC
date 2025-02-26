const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { queryWithTransaction } = require("../../config/database");
const { generateResponse } = require("../../utils/utils");

module.exports.login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    // Validación de campos requeridos
    if (!email || !password) {
      return generateResponse(400, {
        message: "Email and password are required",
      });
    }

    return await queryWithTransaction(async (connection) => {
      // Buscar el usuario por email
      const [users] = await connection.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
      if (users.length === 0) {
        return generateResponse(401, { message: "Invalid email or password" });
      }

      const user = users[0];

      // Comparar la contraseña ingresada con la contraseña encriptada en la base de datos
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        return generateResponse(401, { message: "Invalid email or password" });
      }

      // Generar el access token y el refresh token
      const accessToken = generateAccessToken(user);
      await generateRefreshToken(
        { id: user.id, role: user.role },
        connection
      );

      // Retornar los tokens y los datos del usuario
      return generateResponse(200, {
        accessToken,
        role: user.role,
        // refreshToken, // NO enviar el refresh token al cliente
        // user: { id: user.id, name: user.name, role: user.role }, // Solo enviamos nombre y rol, el id se obtiene desde token...
        // user: { name: user.name, role: user.role },
      });
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.refreshToken = async (event) => {
  try {
    // Obtener el user_id del token de acceso (asumiendo que el accessToken incluye el user_id)
    const accessToken = event.headers["authorization"];
    let decodedAccessToken;

    if (!accessToken) {
      return generateResponse(400, { message: "Access token is required" });
    }

    try {
      decodedAccessToken = await jwt.verify(
        accessToken,
        process.env.JWT_SECRET
      );
    } catch (error) {
      console.error("Error verifying access token:", error.message);
      return generateResponse(403, { message: "Invalid access token" });
    }

    const userId = decodedAccessToken.id;

    return await queryWithTransaction(async (connection) => {
      // Verificar la existencia y validez del refresh token en la base de datos para el userId
      const [tokens] = await connection.execute(
        "SELECT * FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()",
        [userId]
      );

      if (tokens.length === 0) {
        return generateResponse(403, {
          message: "No valid refresh token found",
        });
      }

      // Generar un nuevo token de acceso
      const newAccessToken = generateAccessToken({
        id: userId,
        role: decodedAccessToken.role,
      });

      return generateResponse(200, { accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

// #########################################################################
// Funciones auxiliares
// #########################################################################
// Función para generar el JWT de acceso
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Función para generar el refresh token y almacenarlo en la base de datos
const generateRefreshToken = async (userData, connection) => {
  // refreshToken debe firmar con userData.id y userData.role
  const refreshToken = jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  // Eliminar cualquier refresh token anterior del usuario
  await connection.execute("DELETE FROM refresh_tokens WHERE user_id = ?", [
    userData.id,
  ]);

  // Guardar el nuevo refresh token en la base de datos
  await connection.execute(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))",
    [userData.id, refreshToken]
  );

  return refreshToken;
};
