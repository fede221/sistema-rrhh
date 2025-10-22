const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env', quiet: true });


// Log para mostrar la IP/host y nombre de la base de datos al iniciar
console.log(`🌐 Conectando a la base de datos en host: ${process.env.DB_HOST}, base: ${process.env.DB_NAME}`);

// Crear pool de conexiones con configuraciones válidas para mysql2
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: 'utf8mb4',
  
  // Configuraciones válidas del pool
  connectionLimit: 10,        // Máximo 10 conexiones simultáneas
  queueLimit: 0,             // Sin límite en la cola
  multipleStatements: false,
  timezone: 'local',
  ssl: false,
  
  // Configuraciones de estabilidad válidas
  supportBigNumbers: true,
  bigNumberStrings: false,
  
  // Timeouts y reconexión para evitar conexiones colgadas
  connectTimeout: 10000,      // 10 segundos para conectar
  waitForConnections: true,   // Esperar si no hay conexiones disponibles
  enableKeepAlive: true,      // Mantener conexiones vivas
  keepAliveInitialDelay: 0    // Enviar keep-alive inmediatamente
});

// Manejar eventos del pool
pool.on('connection', (connection) => {
  console.log('🔗 Nueva conexión establecida como id ' + connection.threadId);
  
  // Configurar charset para esta conexión
  connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci", (err) => {
    if (err) {
      console.error('⚠️  Error al configurar charset en conexión:', err.message);
    } else {
      console.log('✅ Charset configurado para conexión ' + connection.threadId);
    }
  });
});

pool.on('error', (err) => {
  console.error('❌ Error en el pool de conexiones:', err.message);
});

// Función para verificar la salud del pool
async function checkPoolHealth() {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1 as health');
    connection.release();
    console.log('✅ Pool de conexiones saludable');
    return true;
  } catch (err) {
    console.error('❌ Error en health check del pool:', err.message);
    return false;
  }
}

// Verificar salud del pool cada 2 minutos (menos frecuente para evitar sobrecarga)
setInterval(() => {
  checkPoolHealth();
}, 120000);

// Configurar charset inicial
setTimeout(() => {
  checkPoolHealth();
}, 2000); // Esperar 2 segundos para que el pool se inicialice

// Manejar cierre graceful de conexiones
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recibido, cerrando pool de conexiones...');
  try {
    await pool.end();
    console.log('✅ Pool cerrado correctamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error cerrando pool:', err.message);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT recibido, cerrando pool de conexiones...');
  try {
    await pool.end();
    console.log('✅ Pool cerrado correctamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error cerrando pool:', err.message);
    process.exit(1);
  }
});

console.log('🚀 Pool de conexiones MySQL inicializado');

// Para mantener compatibilidad total, exportamos un objeto que se comporta como la conexión original
const dbExport = {
  // Pool original para uso avanzado
  pool: pool,
  
  // Exportar función de health check
  checkHealth: checkPoolHealth,
  
  // Método query directo para compatibilidad total
  query: (sql, params, callback) => {
    // Permitir firma flexible: (sql, callback) o (sql, params, callback)
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    // Si se pasa callback, adaptamos la promesa a callback-style
    if (typeof callback === 'function') {
      pool
        .query(sql, params)
        .then(([rows, fields]) => callback(null, rows, fields))
        .catch((err) => callback(err));
      // Devolver undefined como en la API callback tradicional
      return;
    }

    // Si no se pasa callback, devolver la promesa
    return pool.query(sql, params);
  },
  
  // Método execute para prepared statements
  execute: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    if (typeof callback === 'function') {
      pool
        .execute(sql, params)
        .then(([rows, fields]) => callback(null, rows, fields))
        .catch((err) => callback(err));
      return;
    }

    return pool.execute(sql, params);
  }
};

module.exports = dbExport;
