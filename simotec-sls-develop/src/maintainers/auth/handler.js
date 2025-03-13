const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { queryWithTransaction } = require("../config/database");
const { generateResponse } = require("../utils/utils");

// Función comun de login
const loginHandler = async (email, password, tableName, role) => {
    if (!email || !password) {
        return generateResponse(400, { message: "Email and password are required" });
    }

    return await queryWithTransaction(async (connection) => {
        // Buscar usuario en la base de datos según la tabla correspondiente
        const [users] = await connection.execute(`SELECT * FROM ${tableName} WHERE email = ?`, [email]);

        if (users.length === 0) {
            return generateResponse(401, { message: "Invalid email or password" });
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return generateResponse(401, { message: "Invalid email or password" });
        }

        // Generar tokens
        const accessToken = generateAccessToken({ id: user.id, role });
        await generateRefreshToken({ id: user.id, role }, connection);

        return generateResponse(200, { accessToken, role });
    });
};

// Función para generar el token de acceso
const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// Función para generar el refresh token
const generateRefreshToken = async (userData, connection) => {
    const refreshToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Guardamos el refresh token en la tabla correspondiente
    const rolTableMap = {user: "user", admin: "cadmin"};
    const tableName = rolTableMap[userData.role];
    if (!tableName){
      return generateResponse(400,{message:"Rol invalido"});
    }
    await connection.execute(`UPDATE ${tableName} SET token = ? WHERE id = ?`, [refreshToken, userData.id]);

    return refreshToken;
};

module.exports = { loginHandler, generateAccessToken, generateRefreshToken };
