#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const conn = await pool.getConnection();
  
  // Check the corrupted entries
  const [rows] = await conn.query('SELECT id, nombre, HEX(nombre) as hex FROM empresas WHERE id IN (2, 6)');
  
  console.log('Corrupted entries analysis:\n');
  rows.forEach(row => {
    console.log(`ID ${row.id}:`);
    console.log(`  Text: ${row.nombre}`);
    console.log(`  Hex: ${row.hex}`);
    console.log('');
  });
  
  conn.release();
  await pool.end();
})();
