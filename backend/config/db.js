const mysql = require('mysql');
require('dotenv').config({ path: __dirname + '/../.env' });

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: 'utf8mb4',
  
  // Configuraciones mejoradas para estabilidad
  multipleStatements: false,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  
  // Configuraciones adicionales para evitar timeouts
  keepAliveInitialDelay: 300000, // 5 minutos
  enableKeepAlive: true,
  
  // Pool de conexiones simulado con una sola conexión
  connectionLimit: 1,
  queueLimit: 0,
  
  // Manejo de timezone
  timezone: 'local',
  
  // Configuraciones SSL (si es necesario)
  ssl: false
});

// Función para manejar la conexión inicial
function handleConnection() {
  db.connect((err) => {
    if (err) {
      console.error('❌ Error de conexión a MySQL:', err);
      console.log('🔄 Reintentando conexión en 2 segundos...');
      setTimeout(handleConnection, 2000);
      return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
    
    // Configurar charset y collation para la sesión
    db.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci", (err) => {
      if (err) {
        console.error('⚠️  Error al configurar charset:', err);
      } else {
        console.log('✅ Charset configurado a utf8mb4_unicode_ci');
      }
    });
  });
}

// Manejar reconexión automática
db.on('error', (err) => {
  console.error('❌ Error de base de datos:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
    console.log('🔄 Reconectando a la base de datos...');
    handleConnection();
  } else {
    throw err;
  }
});

// Mantener la conexión viva con ping periódico
setInterval(() => {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.error('⚠️  Error en ping de conexión:', err);
    }
  });
}, 300000); // Ping cada 5 minutos

// Iniciar conexión
handleConnection();

module.exports = db;
