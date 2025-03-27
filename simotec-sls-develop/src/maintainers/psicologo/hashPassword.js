// hashPassword.js
const bcrypt = require('bcryptjs');

(async () => {
  console.log("Iniciando script...");

  try {
    const hashed = await bcrypt.hash("psicologo123#", 10);
    console.log("Hashed password:", hashed);
  } catch (error) {
    console.error("Error hashing password:", error);
  }

  console.log("Script finalizado");
})();
