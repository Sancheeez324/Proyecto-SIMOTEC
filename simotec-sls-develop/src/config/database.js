const mysql = require("mysql2/promise");

let pool;

function initializePool() {
  if (!pool) {
    // Decodificar la variable de entorno que contiene el certificado en Base64
    console.debug("DEBUG: Config del cerficado");
    const caCert = Buffer.from(process.env.DB_SSL_CA, 'base64').toString('utf8');
 
    console.log("Inicializando pool de conexiones...");
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 25060,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Configuración SSL
      //ssl: {
      //  ca: caCert,
      //},
    });
  }
  return pool;
}

// Función para ejecutar consultas dentro de una transacción
async function queryWithTransaction(callback) {
  const connection = await initializePool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    console.debug("Committing transaction");
    await connection.commit();
    console.debug("Transaction committed");
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    console.debug("Releasing connection");
    connection.release();
  }
}

module.exports = {
  queryWithTransaction,
};
