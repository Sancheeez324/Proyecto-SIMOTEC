const jwt = require("jsonwebtoken");

const validateToken = async (token) => {
  let access = false;
  try {
    jwt.verify(token, process.env.JWT_SECRET, (err) => {
      if (err) {
        console.log("ACCESS DENIED");
        console.log("ERROR: ", err.message);
        access = false;
      } else {
        console.log("ACCESS GRANTED");
        access = true;
      }
    });

    return access;
  } catch (error) {
    throw new Error("ERROR AL VALIDAR EL TOKEN: ", error.message);
  }
};

module.exports = {
  validateToken
};
