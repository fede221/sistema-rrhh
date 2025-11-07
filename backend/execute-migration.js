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

    console.log('🔧 Migrando tabla vacaciones_solicitadas...\n');

    const migrations = [
      // 1. Agregar columnas de referente
      {
        name: 'Agregar referente_id',
        sql: `ALTER TABLE vacaciones_solicitadas ADD COLUMN referente_id INT DEFAULT NULL`
      },
      {
        name: 'Agregar referente_comentario',
        sql: `ALTER TABLE vacaciones_solicitadas ADD COLUMN referente_comentario MEDIUMTEXT DEFAULT NULL`
      },
      {
        name: 'Agregar fecha_referente',
        sql: `ALTER TABLE vacaciones_solicitadas ADD COLUMN fecha_referente DATETIME DEFAULT NULL`
      },
      // 2. Agregar columnas de RH
      {
        name: 'Agregar rh_id',
        sql: `ALTER TABLE vacaciones_solicitadas ADD COLUMN rh_id INT DEFAULT NULL`
      },
      {
        name: 'Agregar rh_comentario',
        sql: `ALTER TABLE vacaciones_solicitadas ADD COLUMN rh_comentario MEDIUMTEXT DEFAULT NULL`
      },
      {
        name: 'Agregar fecha_rh',
        sql: `ALTER TABLE vacaciones_solicitadas ADD COLUMN fecha_rh DATETIME DEFAULT NULL`
      },
      // 3. Renombrar observaciones
      {
        name: 'Renombrar observaciones a comentarios_empleado',
        sql: `ALTER TABLE vacaciones_solicitadas CHANGE COLUMN observaciones comentarios_empleado MEDIUMTEXT`
      },
      // 4. Actualizar ENUM estado
      {
        name: 'Actualizar ENUM estado',
        sql: `ALTER TABLE vacaciones_solicitadas MODIFY COLUMN estado ENUM('pendiente_referente', 'pendiente_rh', 'aprobado', 'rechazado_referente', 'rechazado_rh', 'pendiente') DEFAULT 'pendiente_referente'`
      },
      // 5. Agregar foreign keys
      {
        name: 'Agregar FK referente_id',
        sql: `ALTER TABLE vacaciones_solicitadas ADD CONSTRAINT fk_referente_id FOREIGN KEY (referente_id) REFERENCES usuarios(id) ON DELETE SET NULL`,
        ignoreIfExists: true
      },
      {
        name: 'Agregar FK rh_id',
        sql: `ALTER TABLE vacaciones_solicitadas ADD CONSTRAINT fk_rh_id FOREIGN KEY (rh_id) REFERENCES usuarios(id) ON DELETE SET NULL`,
        ignoreIfExists: true
      },
      // 6. Agregar índices
      {
        name: 'Agregar índice estado',
        sql: `ALTER TABLE vacaciones_solicitadas ADD INDEX idx_estado (estado)`,
        ignoreIfExists: true
      },
      {
        name: 'Agregar índice referente_id',
        sql: `ALTER TABLE vacaciones_solicitadas ADD INDEX idx_referente_id (referente_id)`,
        ignoreIfExists: true
      },
      {
        name: 'Agregar índice rh_id',
        sql: `ALTER TABLE vacaciones_solicitadas ADD INDEX idx_rh_id (rh_id)`,
        ignoreIfExists: true
      },
      // 7. Crear tabla de historial
      {
        name: 'Crear tabla vacaciones_historial_detalle',
        sql: `CREATE TABLE IF NOT EXISTS vacaciones_historial_detalle (
          id INT PRIMARY KEY AUTO_INCREMENT,
          solicitud_id INT NOT NULL,
          accion ENUM('creado', 'aprobado_referente', 'rechazado_referente', 'aprobado_rh', 'rechazado_rh', 'modificado') NOT NULL,
          realizado_por INT,
          comentario MEDIUMTEXT,
          fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (solicitud_id) REFERENCES vacaciones_solicitadas(id) ON DELETE CASCADE,
          FOREIGN KEY (realizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
          INDEX idx_solicitud_id (solicitud_id),
          INDEX idx_fecha (fecha)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      }
    ];

    let success = 0, skipped = 0;

    for (const migration of migrations) {
      try {
        await conn.execute(migration.sql);
        console.log(`✓ ${migration.name}`);
        success++;
      } catch (err) {
        if (migration.ignoreIfExists && (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_FIELDNAME')) {
          console.log(`⚠ ${migration.name} (ya existe)`);
          skipped++;
        } else {
          console.error(`✗ ${migration.name}: ${err.message}`);
        }
      }
    }

    console.log(`\n📊 Estructura final de tabla vacaciones_solicitadas:\n`);
    const [columns] = await conn.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vacaciones_solicitadas'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    console.table(columns);
    console.log(`\n✅ Migración completada: ${success} cambios, ${skipped} existentes`);

    conn.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
