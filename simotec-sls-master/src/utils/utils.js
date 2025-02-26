const moment = require("moment-timezone");

const generateResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN,
    },
    body: JSON.stringify(body),
  };
};

const getFechaChile = (fecha, isFullDate) => {
  const momentObj = fecha ? moment(fecha) : moment();
  const formattedDate = momentObj
    .tz("America/Santiago")
    .format(isFullDate ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD");
  return formattedDate;
};


const parseEventBody = (event) => {
  let params;
  try {
    params = JSON.parse(event.body);
  } catch (error) {
    if (typeof event.body === "string") {
      params = event.body.split("&").reduce((acc, current) => {
        const [key, value] = current.split("=");
        acc[decodeURIComponent(key)] = decodeURIComponent(value);
        return acc;
      }, {});
    }
  }
  return params || event.queryStringParameters;
};

module.exports = { generateResponse, getFechaChile, parseEventBody };
