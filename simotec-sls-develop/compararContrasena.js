const bcrypt = require("bcryptjs");

const storedHash = "$2a$10$n9cizkMDf6UU8oFaBDDgn.Q82LERMxxuWgbHLbQqfHPHE//tcoY7O"; // Copia el hash real de la BD
const inputPassword = "password123"; // La contraseña original

bcrypt.compare(inputPassword, storedHash)
  .then(result => console.log("¿Coincide la contraseña?", result))
  .catch(err => console.error("Error comparando:", err));
