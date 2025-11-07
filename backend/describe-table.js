const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('📋 Estructura de vacaciones_solicitadas:\n');
    const [columns] = await conn.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vacaciones_solicitadas'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    console.table(columns);

    console.log('\n📊 Estructura de tabla actual:');
    const [createTable] = await conn.query('SHOW CREATE TABLE vacaciones_solicitadas');
    console.log(createTable[0]['Create Table']);

    conn.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
