#!/usr/bin/env node
/**
 * Script to automatically fix UTF-8 encoding issues in the database
 * This version is non-interactive - it automatically performs the conversion
 * 
 * Usage: node fix-encoding-auto.js
 */

require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const mysql = require('mysql2/promise');

// Database connection config
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
  console.log('🔧 UTF-8 Encoding Automatic Fix\n');
  console.log('📋 Database Config:');
  console.log(`   Host: ${DB_CONFIG.host}`);
  console.log(`   Database: ${DB_CONFIG.database}\n`);

  const pool = mysql.createPool(DB_CONFIG);
  let connection;

  try {
    connection = await pool.getConnection();
    console.log('✓ Connected to database\n');

    // Check current state
    const [dbResult] = await connection.query(`SELECT @@character_set_database, @@collation_database`);
    const currentCharset = dbResult[0]['@@character_set_database'];
    console.log(`Current database charset: ${currentCharset}`);
    
    if (currentCharset === 'utf8mb4') {
      console.log('✓ Database is already utf8mb4, no action needed\n');
      await pool.end();
      return;
    }

    // Perform conversion
    console.log('\n🔄 Converting database and tables to utf8mb4...\n');

    // Step 1: Alter database
    try {
      await connection.query(`ALTER DATABASE \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✓ Database converted');
    } catch (err) {
      console.warn(`⚠️  Database error: ${err.message}`);
    }

    // Step 2: Get all tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()`
    );

    // Step 3: Convert each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      try {
        await connection.query(
          `ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`✓ Table '${tableName}' converted`);
      } catch (err) {
        console.warn(`⚠️  Error converting '${tableName}': ${err.message}`);
      }
    }

    console.log('\n✓ Conversion complete!\n');

    // Verify
    const [verifyResult] = await connection.query(`SELECT @@character_set_database`);
    console.log(`Final database charset: ${verifyResult[0]['@@character_set_database']}`);

    // Sample data check
    console.log('\nSampling empresa names after conversion...\n');
    const [samples] = await connection.query(`
      SELECT id, nombre FROM empresas LIMIT 10
    `);
    
    samples.forEach(row => {
      console.log(`   ID ${row.id}: "${row.nombre}"`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Verify data looks correct in the UI');
    console.log('   2. If names still show corrupted, you may need manual data repair');
    console.log('   3. Always ensure new data is inserted with UTF-8 encoding\n');

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
