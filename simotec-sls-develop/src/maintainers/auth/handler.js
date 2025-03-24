const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { queryWithTransaction } = require("../../config/database");
const { generateResponse } = require("../../utils/utils");

const loginHandler = async (event) => {
    try {
        const { email, password, role } = JSON.parse(event.body); // 👈 Extraemos correctamente el body

        console.log("📩 Datos recibidos:", { email, password, role });

        if (!email || !password) {
            return generateResponse(400, { message: "Email and password are required" });
        }

        return await queryWithTransaction(async (connection) => {
            // 1. Buscar en auth_users primero
            const [authUsers] = await connection.execute(
                "SELECT * FROM auth_users WHERE email = ? ", 
                [email]
            );
            console.log("Resultado de auth_users:", authUsers);
            if (authUsers.length === 0) {
                return generateResponse(401, { message: "Invalid credentials" });
            }

            const authUser = authUsers[0];
            
            // 2. Verificar coincidencia de rol
            if (authUser.user_type !== role) {
                return generateResponse(403, { 
                    message: `Ud no es un usuario de tipo ${role}`, 
                    actualRole: authUser.user_type 
                });
            }

            console.log("Contraseña ingresada:", password);
            console.log("Hash en la DB:", authUser.password);

            // 3. Validar contraseña
            const isPasswordValid = await bcrypt.compare(password, authUser.password);
            if (!isPasswordValid) {
                return generateResponse(401, { message: "Invalid credentials" });
            }

            // 4. Obtener datos específicos del rol
            let userData;
            switch (role) {
                case 'user':
                    [userData] = await connection.execute(
                        "SELECT * FROM users WHERE auth_user_id = ?",
                        [authUser.id]
                    );
                    break;
                
                case 'cadmin':
                    [userData] = await connection.execute(
                        "SELECT * FROM cadmins WHERE auth_user_id = ?",
                        [authUser.id]
                    );
                    break;
                
                case 'super_admin':
                    [userData] = await connection.execute(
                        "SELECT * FROM super_admins WHERE auth_user_id = ?",
                        [authUser.id]
                    );
                    break;
                
                default:
                    return generateResponse(400, { message: "Invalid role" });
            }
            console.log(`🔍 Datos obtenidos para ${role}:`, userData);
            if (userData.length === 0) {
                return generateResponse(500, { message: "User data inconsistency" });
            }

            // 5. Generar tokens
            const specificUser = userData[0];
            const accessToken = generateAccessToken({ 
                id: specificUser.id, 
                authId: authUser.id,
                role: authUser.user_type 
            });
            
            await generateRefreshToken(authUser.id, connection);

            return generateResponse(200, { 
                token: accessToken, 
                role: authUser.user_type,
                user: authUser,
                userId: specificUser.id,
                authId: authUser.id
            });
        });
    }catch (error) {
        console.error("❌ Error en login:", error);
        return generateResponse(500, { message: "Internal server error" });
    }

    
};

const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            authId: user.authId,
            role: user.role 
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