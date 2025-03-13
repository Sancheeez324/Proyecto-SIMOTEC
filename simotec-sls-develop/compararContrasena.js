const bcrypt = require("bcryptjs");

const storedHash = "$2a$10$xfUCO5UXmnGC5nrm25boheekJHOA8TNDKkfO60YIHMlAAxWq3y4OW"; // Copia el hash real de la BD
const inputPassword = "clave4567"; // La contraseña original

bcrypt.compare(inputPassword, storedHash)
  .then(result => console.log("¿Coincide la contraseña?", result))
  .catch(err => console.error("Error comparando:", err));
