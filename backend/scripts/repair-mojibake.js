#!/usr/bin/env node
/**
 * Script to repair corrupted UTF-8 data
 * Converts mojibake text back to proper UTF-8
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
    console.log('🔧 Repairing corrupted encoding in empresas.nombre...\n');

    // Find entries with potential corruption
    const [corrupted] = await conn.query(
      `SELECT id, nombre FROM empresas WHERE nombre LIKE '%Ã%' OR nombre LIKE '%â%'`
    );

    console.log(`Found ${corrupted.length} entries with potential corruption\n`);

    for (const row of corrupted) {
      // Convert the corrupted text: interpret UTF-8 bytes as latin1, then encode to proper UTF-8
      try {
        const fixed = Buffer.from(row.nombre, 'latin1').toString('utf8');
        
        console.log(`Before: "${row.nombre}"`);
        console.log(`After:  "${fixed}"`);
        
        await conn.query('UPDATE empresas SET nombre = ? WHERE id = ?', [fixed, row.id]);
        console.log(`✓ Fixed ID ${row.id}\n`);
      } catch (err) {
        console.warn(`⚠️  Error fixing ID ${row.id}: ${err.message}\n`);
      }
    }

    // Also fix razon_social
    console.log('\n🔧 Repairing corrupted encoding in empresas.razon_social...\n');
    const [corruptedRazon] = await conn.query(
      `SELECT id, razon_social FROM empresas WHERE razon_social LIKE '%Ã%' OR razon_social LIKE '%â%'`
    );

    console.log(`Found ${corruptedRazon.length} entries with potential corruption\n`);

    for (const row of corruptedRazon) {
      try {
        const fixed = Buffer.from(row.razon_social, 'latin1').toString('utf8');
        
        console.log(`Before: "${row.razon_social}"`);
        console.log(`After:  "${fixed}"`);
        
        await conn.query('UPDATE empresas SET razon_social = ? WHERE id = ?', [fixed, row.id]);
        console.log(`✓ Fixed ID ${row.id}\n`);
      } catch (err) {
        console.warn(`⚠️  Error fixing ID ${row.id}: ${err.message}\n`);
      }
    }

    console.log('✓ Repair complete!\n');
    console.log('💡 Next: Restart the backend server to reload database connections');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
