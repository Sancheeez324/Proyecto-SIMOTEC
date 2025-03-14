const bcrypt = require("bcryptjs");

async function generateHash() {
  const password = "UserPass789!"; // Reemplaza con la contraseña que insertaste en la BD
  const saltRounds = 10;
  
  const hash = await bcrypt.hash(password, saltRounds);
  console.log("Contraseña encriptada:", hash);
}

generateHash();