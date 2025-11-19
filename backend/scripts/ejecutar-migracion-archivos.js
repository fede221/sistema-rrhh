const mysql = require('mysql2/promise');
const fs = require('fs');

async function ejecutarMigracion() {
  let connection;
  
  try {
    console.log('📦 Conectando a la base de datos RRHH...');
    
    connection = await mysql.createConnection({
      host: '34.176.128.94',
      user: 'root',
      password: 'pos38ric0S',
      database: 'rrhhdev',
      port: 3306,
      multipleStatements: true
    });

    console.log('✅ Conectado exitosamente a rrhhdev\n');

    // SQL simplificado sin el ALTER TABLE COMMENT que causa error
    const sql = `
CREATE TABLE IF NOT EXISTS legajo_archivos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  legajo_id INT NOT NULL,
  tipo_documento ENUM('dni_frente', 'dni_dorso', 'titulo', 'certificado', 'constancia', 'otro') NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tamaño_kb INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  subido_por INT,
  activo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (legajo_id) REFERENCES legajos(id) ON DELETE CASCADE,
  FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_legajo_id (legajo_id),
  INDEX idx_tipo_documento (tipo_documento),
  INDEX idx_fecha_subida (fecha_subida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('📋 Ejecutando migración: Creación de tabla legajo_archivos...');
    await connection.query(sql);
    console.log('✅ Tabla legajo_archivos creada exitosamente\n');

    // Verificar que la tabla se creó correctamente
    const [rows] = await connection.query(`
      SELECT 
        TABLE_NAME, 
        TABLE_ROWS, 
        CREATE_TIME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'rrhhdev' 
        AND TABLE_NAME = 'legajo_archivos'
    `);

    if (rows.length > 0) {
      console.log('✅ Verificación exitosa:');
      console.log(`   - Tabla: ${rows[0].TABLE_NAME}`);
      console.log(`   - Registros: ${rows[0].TABLE_ROWS}`);
      console.log(`   - Fecha creación: ${rows[0].CREATE_TIME}`);
    }

    console.log('\n🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

ejecutarMigracion();
