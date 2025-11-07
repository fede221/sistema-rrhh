const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env', quiet: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

async function checkSchema() {
  const conn = await pool.getConnection();
  const [columns] = await conn.query('DESCRIBE vacaciones_anuales');
  console.table(columns);
  conn.release();
  await pool.end();
}

checkSchema();
