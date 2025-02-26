const mysql = require("mysql2/promise");

let pool;

// Función para inicializar el pool de conexiones
function initializePool() {
  if (!pool) {
    console.log("Inicializando pool de conexiones...");
    pool = mysql.createPool({
      host: process.env.DB_HOST, // Aurora endpoint (nombre DNS)
      user: process.env.DB_USER, // Usuario de la base de datos
      password: process.env.DB_PASSWORD, // Contraseña de la base de datos
      database: process.env.DB_NAME, // Nombre de la base de datos
      waitForConnections: true,
      connectionLimit: 10, // Ajusta según tus necesidades
      queueLimit: 0,
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
