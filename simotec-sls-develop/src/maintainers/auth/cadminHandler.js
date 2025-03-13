const { loginHandler } = require("../auth/handler");
const { generateResponse } = require("../../utils/utils");

module.exports.login = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);
        return await loginHandler(email, password, "cadmins", "admin");
    } catch (error) {
        console.error("Error in admin login:", error);
        return generateResponse(500, { message: "Internal Server Error" });
    }
};
