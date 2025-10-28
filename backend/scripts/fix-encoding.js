#!/usr/bin/env node
/**
 * Script to diagnose and fix UTF-8 encoding issues in the database
 * 
 * Usage: node fix-encoding.js
 * 
 * This script will:
 * 1. Check the charset of all tables
 * 2. Detect corrupted (mojibake) data
 * 3. Convert tables to utf8mb4 if needed
 * 4. Optionally repair corrupted data
 */

require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const mysql = require('mysql2/promise');
const readline = require('readline');

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

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
  console.log('🔍 UTF-8 Encoding Diagnostic Tool\n');
  console.log('📋 Database Config:');
  console.log(`   Host: ${DB_CONFIG.host}`);
  console.log(`   Port: ${DB_CONFIG.port}`);
  console.log(`   User: ${DB_CONFIG.user}`);
  console.log(`   Database: ${DB_CONFIG.database}\n`);

  let connection;

  try {
    // Create pool with single connection
    const pool = mysql.createPool(DB_CONFIG);
    connection = await pool.getConnection();
    
    console.log('✓ Connected to database\n');

    // Step 1: Check database charset
    console.log('Step 1: Checking database charset...\n');
    const dbCharset = await checkDatabaseCharset(connection);
    console.log(`✓ Database charset: ${dbCharset}\n`);

    // Step 2: Check all tables
    console.log('Step 2: Checking table charsets...\n');
    const tables = await checkTableCharsets(connection);
    console.table(tables);

    // Step 3: Sample data check for mojibake
    console.log('\nStep 3: Sampling empresa names for encoding issues...\n');
    const samples = await checkEncodingIssues(connection);
    
    if (samples.length > 0) {
      console.log('⚠️  Potential encoding issues detected:\n');
      samples.forEach(row => {
        console.log(`   ID ${row.id}: "${row.nombre}"`);
        console.log(`      Hex: ${row.hex_nombre}`);
        console.log(`      Looks corrupted: ${row.looksCorrupted ? 'YES ⚠️' : 'NO'}\n`);
      });

      const shouldFix = await question('Would you like to convert tables to utf8mb4? (yes/no): ');
      
      if (shouldFix.toLowerCase() === 'yes') {
        console.log('\n🔧 Converting tables to utf8mb4...\n');
        await fixEncoding(connection);
        console.log('\n✓ Conversion complete!\n');
        
        console.log('💡 Next steps:');
        console.log('   1. Check if data looks correct in the UI');
        console.log('   2. If still corrupted, data may need manual recovery');
        console.log('   3. For future: always insert data using UTF-8 encoding\n');
      }
    } else {
      console.log('✓ No encoding issues detected!\n');
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (e) {}
    }
    rl.close();
  }
}

async function checkDatabaseCharset(connection) {
  try {
    const [results] = await connection.query(`SELECT @@character_set_database, @@collation_database`);
    const row = results[0];
    return `${row['@@character_set_database']} (${row['@@collation_database']})`;
  } catch (err) {
    throw err;
  }
}

async function checkTableCharsets(connection) {
  try {
    // Get tables from information_schema
    const [results] = await connection.query(`
      SELECT 
        TABLE_NAME,
        TABLE_COLLATION
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    
    return results.map(row => ({
      Table: row.TABLE_NAME,
      Collation: row.TABLE_COLLATION,
      Status: row.TABLE_COLLATION?.includes('utf8mb4') ? '✓' : '⚠️'
    }));
  } catch (err) {
    throw err;
  }
}

async function checkEncodingIssues(connection) {
  try {
    const [results] = await connection.query(`
      SELECT 
        id, 
        nombre, 
        HEX(nombre) as hex_nombre,
        LENGTH(nombre) as byte_length,
        CHAR_LENGTH(nombre) as char_length
      FROM empresas 
      LIMIT 10
    `);
    
    // Detect mojibake patterns
    const analyzed = results.map(row => ({
      ...row,
      looksCorrupted: detectMojibake(row.nombre, row.hex_nombre)
    }));
    
    return analyzed;
  } catch (err) {
    // Table might not exist or is empty
    console.warn('⚠️  Could not check empresas table:', err.message);
    return [];
  }
}

function detectMojibake(text, hex) {
  // Check for common mojibake patterns:
  // 1. Multiple consecutive bytes starting with C2/C3 (UTF-8 double-encoding)
  // 2. Invalid UTF-8 sequences
  // 3. Control characters
  
  const invalidPatterns = [
    /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, // Control characters
    /(\xc2[\x80-\x9f])+/g, // UTF-8 encoded control chars
    /(\xc3[\x80-\xbf]){3,}/g // Repeated UTF-8 multibyte
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // Check if hex looks like double-encoded UTF-8
  // (e.g., C3 A9 is UTF-8 for é, but if stored as UTF-8 bytes and read as latin1, becomes mojibake)
  const hexLower = hex.toLowerCase();
  if (/^(c2|c3|e2|e3)[89ab][0-9a-f]{2}/.test(hexLower)) {
    // Could be valid UTF-8 or mojibake, needs more analysis
    // If the pattern repeats with control chars, likely mojibake
    if (/^(c2[89ab]){2,}/.test(hexLower) || /^(c3[89ab]){2,}/.test(hexLower)) {
      return true;
    }
  }
  
  return false;
}

async function fixEncoding(connection) {
  const queries = [
    `ALTER DATABASE \`rrhh_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE \`usuarios\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE \`empresas\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE \`legajos\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE \`recibos\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE \`permisos\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE \`vacaciones\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `ALTER TABLE \`preguntas\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  ];
  
  for (const query of queries) {
    try {
      await connection.query(query);
      const tableName = query.match(/`(\w+)`/)[1];
      console.log(`✓ ${tableName} converted`);
    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        const tableName = query.match(/`(\w+)`/)[1];
        console.warn(`⚠️  Table ${tableName} does not exist, skipping`);
      } else {
        console.warn(`⚠️  Error: ${err.message}`);
      }
    }
  }
}

// Run the script
main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
