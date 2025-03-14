const bcrypt = require("bcryptjs");

const storedHash = "$2a$10$xXPQKaJAdZjFQGMsvJEd2ubor9xlIwaa8N.dkYMM/8DiXmeoDfmGi"; // Copia el hash real de la BD
const inputPassword = "UserPass789!"; // La contraseña original

bcrypt.compare(inputPassword, storedHash)
  .then(result => console.log("¿Coincide la contraseña?", result))
  .catch(err => console.error("Error comparando:", err));
