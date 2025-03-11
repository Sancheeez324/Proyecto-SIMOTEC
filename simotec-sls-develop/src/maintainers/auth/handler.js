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

      console.log("Usuarios encontrados en la BD:", users);
      const user = users[0];      

      console.log("Contraseña ingresada:", password);
      console.log("Hash en la BD:", user.password);

      // Comparar la contraseña ingresada con la contraseña encriptada en la base de datos
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return generateResponse(401, { message: "Invalid email or password" });
      }

      // Determinar el rol basado en `cadmin_id`
      const role = user.cadmin_id ? "admin" : "user";  

      // Generar tokens
      const accessToken = generateAccessToken({ id: user.id, role });
      await generateRefreshToken({ id: user.id, role }, connection);

      console.log("Usuario autenticado:", user);
      console.log("Rol determinado:", role); // <-- Verificamos que se está enviando el rol correcto

      // Retornar tokens y rol del usuario
      return generateResponse(200, {
        accessToken,
        role, // Aseguramos que se envía correctamente
      });
        });
  } catch (error) {
    console.error("Error logging in:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.refreshToken = async (event) => {
  try {
    const accessToken = event.headers["authorization"];
    let decodedAccessToken;

    if (!accessToken) {
      return generateResponse(400, { message: "Access token is required" });
    }

    try {
      decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
      console.error("Error verifying access token:", error.message);
      return generateResponse(403, { message: "Invalid access token" });
    }

    const userId = decodedAccessToken.id;

    return await queryWithTransaction(async (connection) => {
      // Obtener el refresh token almacenado en la tabla `users`
      const [users] = await connection.execute(
        "SELECT token FROM users WHERE id = ?",
        [userId]
      );

      if (users.length === 0 || !users[0].token) {
        return generateResponse(403, { message: "No valid refresh token found" });
      }

      const storedRefreshToken = users[0].token;

      // Verificar si el refresh token es válido
      try {
        jwt.verify(storedRefreshToken, process.env.JWT_SECRET);
      } catch (error) {
        console.error("Invalid refresh token:", error.message);
        return generateResponse(403, { message: "Invalid refresh token" });
      }

      // Generar un nuevo access token
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

// Función para generar el refresh token y almacenarlo en `users.token`
const generateRefreshToken = async (userData, connection) => {
  const refreshToken = jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  // Guardar el refresh token en la tabla `users`
  await connection.execute("UPDATE users SET token = ? WHERE id = ?", [
    refreshToken,
    userData.id,
  ]);

  return refreshToken;
};
