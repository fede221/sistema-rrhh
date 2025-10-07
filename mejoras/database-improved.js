// Configuración mejorada de base de datos
const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones real
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  
  // Configuración del pool
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  
  // Configuraciones de seguridad
  multipleStatements: false,
  charset: 'utf8mb4',
  timezone: 'Z',
  
  // Reconexión automática
  reconnect: true,
  idleTimeout: 300000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Función para ejecutar queries con manejo de errores
const executeQuery = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

// Función para transacciones
const executeTransaction = async (queries) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  executeQuery,
  executeTransaction
};