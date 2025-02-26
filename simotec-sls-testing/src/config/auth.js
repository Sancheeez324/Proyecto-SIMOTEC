const jwt = require("jsonwebtoken");

// Función para validar el token de acceso y verificar si el rol está en la lista de roles permitidos
const validateToken = async (token, allowedRoles = []) => {
  try {
    // Verificar el token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el rol del usuario esté en el array de roles permitidos
    if (!allowedRoles.includes(decoded.role)) {
      throw new Error(`Unauthorized: Access requires one of the following roles: ${allowedRoles.join(", ")}`);
    }

    console.log("ACCESS GRANTED");
    return decoded; // Retornar la información del token (usuario, rol, etc.)
  } catch (err) {
    console.log("ACCESS DENIED");
    console.log("ERROR: ", err.message);
    throw new Error(err.message); // Lanzar error en caso de token inválido o rol incorrecto
  }
};

module.exports = {
  validateToken,
};
