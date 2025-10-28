#!/usr/bin/env node
/**
 * Script to repair corrupted UTF-8 data using MySQL's CONVERT
 */

require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rrhh_db',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

async function main() {
  const pool = mysql.createPool(DB_CONFIG);
  const conn = await pool.getConnection();

  try {
    console.log('🔧 Using MySQL CONVERT to repair mojibake...\n');

    // The most reliable way to fix double-encoded UTF-8:
    // 1. CAST to BINARY (interpret as raw bytes)
    // 2. CAST to CHAR with latin1 (read those bytes as latin1)
    // 3. CAST to BINARY again
    // 4. CAST to CHAR with utf8mb4 (read as proper UTF-8)

    console.log('Fixing empresas.nombre...');
    await conn.query(`
      UPDATE empresas 
      SET nombre = CAST(CAST(CONVERT(nombre USING latin1) AS BINARY) AS CHAR CHARACTER SET utf8mb4)
    `);
    
    console.log('Fixing empresas.razon_social...');
    await conn.query(`
      UPDATE empresas 
      SET razon_social = CAST(CAST(CONVERT(razon_social USING latin1) AS BINARY) AS CHAR CHARACTER SET utf8mb4)
    `);

    console.log('Fixing empresas.direccion...');
    await conn.query(`
      UPDATE empresas 
      SET direccion = CAST(CAST(CONVERT(direccion USING latin1) AS BINARY) AS CHAR CHARACTER SET utf8mb4)
    `);

    // Verify the fix
    console.log('\n✓ Conversion applied! Verifying results...\n');

    const [results] = await conn.query(`
      SELECT id, nombre FROM empresas LIMIT 10
    `);

    results.forEach(row => {
      console.log(`ID ${row.id}: "${row.nombre}"`);
    });

    console.log('\n✓ Done! Restart the backend for changes to take effect');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
