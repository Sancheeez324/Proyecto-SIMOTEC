const { loginHandler } = require("../auth/handler");
const { generateResponse } = require("../../utils/utils");

module.exports.login = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);
        return await loginHandler(email, password, "users", "user");
    } catch (error) {
        console.error("Error in user login:", error);
        return generateResponse(500, { message: "Internal Server Error" });
    }
};
