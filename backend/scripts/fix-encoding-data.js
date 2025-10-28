#!/usr/bin/env node
/**
 * Script to repair corrupted UTF-8 data that was stored as latin1
 * 
 * This script fixes the double-encoding issue by:
 * 1. Converting corrupted UTF-8 text back to latin1 bytes
 * 2. Re-interpreting those bytes as UTF-8
 * 
 * Usage: node fix-encoding-data.js
 */

require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rrhh_db',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  connectionLimit: 1
};

async function main() {
  console.log('🔧 UTF-8 Data Repair Tool\n');
  console.log('This will repair corrupted text in string columns\n');

  const pool = mysql.createPool(DB_CONFIG);
  let connection;

  try {
    connection = await pool.getConnection();
    console.log('✓ Connected to database\n');

    // Tables and columns to repair (those that had text corruption)
    const columnsToRepair = [
      { table: 'empresas', column: 'nombre' },
      { table: 'empresas', column: 'razon_social' },
      { table: 'empresas', column: 'direccion' },
      { table: 'empresas', column: 'contacto_nombre' },
      { table: 'legajos', column: 'nombre' },
      { table: 'legajos', column: 'apellido' },
      { table: 'legajos', column: 'numero_documento' },
      { table: 'usuarios', column: 'nombre' },
      { table: 'preguntas', column: 'pregunta' },
      { table: 'preguntas', column: 'respuesta' }
    ];

    console.log('🔄 Repairing corrupted data...\n');

    // For each column, use CONVERT to fix the encoding
    for (const { table, column } of columnsToRepair) {
      try {
        // Check if column exists
        const [colExists] = await connection.query(
          `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, column]
        );

        if (colExists.length === 0) {
          console.log(`⊘ Skipped '${table}.${column}' (column not found)`);
          continue;
        }

        // Use CONVERT to fix double-encoding:
        // CAST(CAST(column AS BINARY) AS CHAR CHARACTER SET utf8mb4)
        // This reads the corrupted UTF-8 text as binary, then interprets those bytes as proper UTF-8
        await connection.query(
          `UPDATE \`${table}\` 
           SET \`${column}\` = CONVERT(CAST(CONVERT(\`${column}\` USING latin1) AS BINARY) USING utf8mb4)
           WHERE \`${column}\` IS NOT NULL 
           AND \`${column}\` REGEXP '[ÃƒÆ'ÃÂÃÂ±ÃÂÂ­]'`,
          []
        );

        console.log(`✓ Repaired '${table}.${column}'`);
      } catch (err) {
        console.warn(`⚠️  Error repairing '${table}.${column}': ${err.message}`);
      }
    }

    console.log('\n✓ Data repair complete!\n');

    // Verify some data
    console.log('Verifying empresa names after repair:\n');
    const [samples] = await connection.query(`
      SELECT id, nombre FROM empresas LIMIT 10
    `);

    samples.forEach(row => {
      console.log(`   ID ${row.id}: "${row.nombre}"`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Restart the backend server to reload the connection');
    console.log('   2. Check the Gestión de Empresas module in the UI');
    console.log('   3. Company names should now display correctly\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (e) {}
    }
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
