const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de las bases de datos
const dbDev = {
  host: process.env.DB_HOST || '34.176.128.94',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'pos38ric0S',
  database: 'rrhhdev',
  port: process.env.DB_PORT || 3306
};

const dbProd = {
  host: process.env.DB_HOST || '34.176.128.94',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'pos38ric0S',
  database: 'RRHH',
  port: process.env.DB_PORT || 3306
};

async function compareAndMigrate() {
  let devConnection, prodConnection;
  
  try {
    console.log('🔗 Conectando a las bases de datos...');
    devConnection = await mysql.createConnection(dbDev);
    prodConnection = await mysql.createConnection(dbProd);
    console.log('✅ Conexiones establecidas');

    // 1. Comparar estructura de tabla vacaciones_solicitadas
    console.log('\n📋 Comparando estructura de tabla vacaciones_solicitadas...');
    
    const [devColumns] = await devConnection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'rrhhdev' AND TABLE_NAME = 'vacaciones_solicitadas'
      ORDER BY ORDINAL_POSITION
    `);

    const [prodColumns] = await prodConnection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'RRHH' AND TABLE_NAME = 'vacaciones_solicitadas'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n🔍 Columnas en DESARROLLO (rrhhdev):');
    devColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA}`);
    });

    console.log('\n🔍 Columnas en PRODUCCIÓN (RRHH):');
    prodColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA}`);
    });

    // 2. Encontrar diferencias
    const devColumnNames = devColumns.map(col => col.COLUMN_NAME);
    const prodColumnNames = prodColumns.map(col => col.COLUMN_NAME);

    const missingInProd = devColumnNames.filter(name => !prodColumnNames.includes(name));
    const extraInProd = prodColumnNames.filter(name => !devColumnNames.includes(name));

    console.log('\n❌ Columnas que faltan en PRODUCCIÓN:');
    if (missingInProd.length === 0) {
      console.log('  ✅ Ninguna');
    } else {
      missingInProd.forEach(col => console.log(`  - ${col}`));
    }

    console.log('\n➕ Columnas extra en PRODUCCIÓN:');
    if (extraInProd.length === 0) {
      console.log('  ✅ Ninguna');
    } else {
      extraInProd.forEach(col => console.log(`  - ${col}`));
    }

    // 3. Generar script de migración si hay diferencias
    if (missingInProd.length > 0) {
      console.log('\n📝 Generando script de migración...');
      let migrationScript = '-- Script de migración para tabla vacaciones_solicitadas\n';
      migrationScript += '-- Ejecutar en base RRHH (PRODUCCIÓN)\n\n';

      for (const columnName of missingInProd) {
        const columnDef = devColumns.find(col => col.COLUMN_NAME === columnName);
        let alterStatement = `ALTER TABLE vacaciones_solicitadas ADD COLUMN ${columnName} ${columnDef.DATA_TYPE}`;
        
        if (columnDef.IS_NULLABLE === 'NO') {
          alterStatement += ' NOT NULL';
        }
        
        if (columnDef.COLUMN_DEFAULT) {
          alterStatement += ` DEFAULT ${columnDef.COLUMN_DEFAULT}`;
        }
        
        if (columnDef.EXTRA) {
          alterStatement += ` ${columnDef.EXTRA}`;
        }
        
        migrationScript += alterStatement + ';\n';
      }

      console.log('\n📋 SCRIPT DE MIGRACIÓN:\n');
      console.log(migrationScript);

      // Guardar script en archivo
      const fs = require('fs');
      fs.writeFileSync('./migration-script.sql', migrationScript);
      console.log('✅ Script guardado en migration-script.sql');
    }

    // 4. Comparar algunos registros de ejemplo
    console.log('\n🔢 Contando registros...');
    
    const [devCount] = await devConnection.execute('SELECT COUNT(*) as total FROM vacaciones_solicitadas');
    const [prodCount] = await prodConnection.execute('SELECT COUNT(*) as total FROM vacaciones_solicitadas');
    
    console.log(`📊 Registros en DESARROLLO: ${devCount[0].total}`);
    console.log(`📊 Registros en PRODUCCIÓN: ${prodCount[0].total}`);

    // 5. Verificar algunos registros recientes
    if (devCount[0].total > 0) {
      console.log('\n🔍 Últimos 3 registros en DESARROLLO:');
      const [devRecords] = await devConnection.execute(`
        SELECT id, usuario_id, fecha_inicio, fecha_fin, estado, fecha_solicitud 
        FROM vacaciones_solicitadas 
        ORDER BY id DESC LIMIT 3
      `);
      devRecords.forEach(record => {
        console.log(`  ID: ${record.id}, Usuario: ${record.usuario_id}, Desde: ${record.fecha_inicio}, Hasta: ${record.fecha_fin}, Estado: ${record.estado}, Solicitud: ${record.fecha_solicitud}`);
      });
    }

    if (prodCount[0].total > 0) {
      console.log('\n🔍 Últimos 3 registros en PRODUCCIÓN:');
      try {
        const [prodRecords] = await prodConnection.execute(`
          SELECT id, usuario_id, fecha_inicio, fecha_fin, estado, fecha_solicitud 
          FROM vacaciones_solicitadas 
          ORDER BY id DESC LIMIT 3
        `);
        prodRecords.forEach(record => {
          console.log(`  ID: ${record.id}, Usuario: ${record.usuario_id}, Desde: ${record.fecha_inicio}, Hasta: ${record.fecha_fin}, Estado: ${record.estado}, Creado: ${record.fecha_solicitud}`);
        });
      } catch (error) {
        console.log('  ⚠️ Error al consultar registros de producción (probablemente diferencias de esquema)');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (devConnection) await devConnection.end();
    if (prodConnection) await prodConnection.end();
    console.log('\n🔒 Conexiones cerradas');
  }
}

// Ejecutar comparación
compareAndMigrate();