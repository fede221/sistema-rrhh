// Script para ejecutar migración SQL
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const migrationFile = path.join(__dirname, 'migrations', '001_actualizar_vacaciones_solicitadas.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

// Dividir en queries individuales
const queries = sql
  .split(';')
  .map(q => q.trim())
  .filter(q => q.length > 0 && !q.startsWith('--'));

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'sistema_rrhh',
      multipleStatements: true
    });

    console.log('✓ Conectado a la base de datos');
    console.log(`\n📋 Ejecutando ${queries.length} queries...\n`);

    for (const query of queries) {
      try {
        const result = await connection.execute(query);
        console.log('✓ Query ejecutada:', query.substring(0, 80) + '...');
      } catch (err) {
        // Algunas queries pueden fallar si la columna ya existe (OK esperado)
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
          console.log('⚠ Columna/índice ya existe (esperado):', query.substring(0, 60) + '...');
        } else if (err.code === 'ER_KEY_COLUMN_DOES_NOT_EXITS') {
          console.log('⚠ Columna no encontrada (esperado):', query.substring(0, 60) + '...');
        } else {
          console.error('✗ Error:', err.message);
          console.error('  Query:', query.substring(0, 100) + '...');
        }
      }
    }

    console.log('\n📊 Verificando estructura final de tabla...\n');
    const [rows] = await connection.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sistema_rrhh' 
        AND TABLE_NAME = 'vacaciones_solicitadas'
      ORDER BY ORDINAL_POSITION
    `);

    console.table(rows);

    console.log('\n✓ Migración completada exitosamente');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('✗ Error fatal:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
})();
