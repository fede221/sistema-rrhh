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

    const [tables] = await conn.query('SHOW TABLES');
    console.log('📋 Todas las tablas:');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      if (tableName.includes('vacaciones') || tableName.includes('Vacaciones')) {
        console.log(`  ✓ ${tableName}`);
      }
    });

    // Buscar todas las tablas
    console.log('\nTodas las tablas de la BD:');
    tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

    conn.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
