const { generateResponse, getFechaChile } = require("./utils/utils");

module.exports.handler = async (event) => {
  try {
    // return date
    const date = getFechaChile(null, true);

    return generateResponse(200, { date });
  } catch (error) {
    console.error(error);
    return generateResponse(500, error.messsage);
  }
};

module.exports.processTest = async (event) => {
  try {
    return generateResponse(200, "Process Test");
  } catch (error) {
    console.error(error);
    return generateResponse(500, error.messsage);
  }
};
