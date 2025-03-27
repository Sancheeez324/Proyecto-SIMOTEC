const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { queryWithTransaction } = require("../../config/database");
const { generateResponse } = require("../../utils/utils");

const loginHandler = async (event) => {
  try {
    const { email, password, role } = JSON.parse(event.body);
    console.log("📩 Datos recibidos:", { email, password, role });

    if (!email || !password) {
      return generateResponse(400, { message: "Email and password are required" });
    }

    return await queryWithTransaction(async (connection) => {
      // 1. Buscar en auth_users
      const [authUsers] = await connection.execute(
        "SELECT * FROM auth_users WHERE email = ?",
        [email]
      );
      if (authUsers.length === 0) {
        return generateResponse(401, { message: "Invalid credentials" });
      }

      const authUser = authUsers[0];

      // 2. Verificar coincidencia de rol
      if (authUser.user_type !== role) {
        return generateResponse(403, {
          message: `Ud no es un usuario de tipo ${role}`,
          actualRole: authUser.user_type,
        });
      }

      // 3. Validar contraseña con bcrypt
      const isPasswordValid = await bcrypt.compare(password, authUser.password);
      if (!isPasswordValid) {
        return generateResponse(401, { message: "Invalid credentials" });
      }
      console.log("Rol recibido en backend:", role);
      console.log("authUser.user_type:", authUser.user_type);
      // 4. Obtener datos específicos del rol
      let userData;
      switch (role) {
        case "user":
          [userData] = await connection.execute(
            "SELECT * FROM users WHERE auth_user_id = ?",
            [authUser.id]
          );
          break;

        case "cadmin":
          [userData] = await connection.execute(
            "SELECT * FROM cadmins WHERE auth_user_id = ?",
            [authUser.id]
          );
          break;

        case "super_admin":
          [userData] = await connection.execute(
            "SELECT * FROM super_admins WHERE auth_user_id = ?",
            [authUser.id]
          );
          break;

        case "psicologo":
          // Como no hay tabla `psychologists`, usamos un objeto mínimo:
          userData = [{ id: authUser.id }];
          break;

        default:
          return generateResponse(400, { message: "Invalid role" });
      }

      // 5. Validar userData
      if (!userData || userData.length === 0) {
        return generateResponse(500, { message: "User data inconsistency" });
      }

      const specificUser = userData[0];

      // 6. Generar accessToken
      const accessToken = generateAccessToken({
        id: specificUser.id,
        authId: authUser.id,
        role: authUser.user_type,
      });

      // 7. Generar y guardar refreshToken en la BD
      await generateRefreshToken(authUser.id, connection);

      return generateResponse(200, {
        token: accessToken,
        role: authUser.user_type,
        user: authUser,
        userId: specificUser.id,
        authId: authUser.id,
      });
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    return generateResponse(500, { message: "Internal server error" });
  }
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      authId: user.authId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const generateRefreshToken = async (authUserId, connection) => {
  const refreshToken = jwt.sign(
    { authId: authUserId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  await connection.execute(
    "UPDATE auth_users SET token = ? WHERE id = ?",
    [refreshToken, authUserId]
  );

  return refreshToken;
};

module.exports = { loginHandler, generateAccessToken, generateRefreshToken };
