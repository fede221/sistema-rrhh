const mysql = require('mysql2/promise');

// Configuración para ambas bases de datos
const dbConfigs = {
  dev: {
    host: '34.176.128.94',
    user: 'root',
    password: 'pos38ric0S',
    database: 'rrhhdev',
    port: 3306
  },
  prod: {
    host: '34.176.128.94',
    user: 'root',
    password: 'pos38ric0S',
    database: 'RRHH',
    port: 3306
  }
};

async function compareTableStructures() {
  let devConnection, prodConnection;
  
  try {
    console.log('🔗 Conectando a las bases de datos...');
    
    // Conectar a ambas bases
    devConnection = await mysql.createConnection(dbConfigs.dev);
    prodConnection = await mysql.createConnection(dbConfigs.prod);
    
    console.log('✅ Conexiones establecidas\n');
    
    // Obtener estructura de vacaciones_solicitadas en DEV
    console.log('📊 Comparando estructura de vacaciones_solicitadas...\n');
    
    const [devColumns] = await devConnection.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'rrhhdev' 
        AND TABLE_NAME = 'vacaciones_solicitadas'
      ORDER BY ORDINAL_POSITION
    `);
    
    const [prodColumns] = await prodConnection.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'RRHH' 
        AND TABLE_NAME = 'vacaciones_solicitadas'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('=== ESTRUCTURA EN DESARROLLO (rrhhdev) ===');
    devColumns.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA || ''}`);
    });
    
    console.log('\n=== ESTRUCTURA EN PRODUCCIÓN (RRHH) ===');
    prodColumns.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA || ''}`);
    });
    
    // Comparar diferencias
    console.log('\n=== DIFERENCIAS ENCONTRADAS ===');
    
    const devColumnNames = devColumns.map(c => c.COLUMN_NAME);
    const prodColumnNames = prodColumns.map(c => c.COLUMN_NAME);
    
    // Columnas en DEV que no están en PROD
    const missingInProd = devColumnNames.filter(name => !prodColumnNames.includes(name));
    if (missingInProd.length > 0) {
      console.log('❌ Columnas que faltan en PRODUCCIÓN:');
      missingInProd.forEach(name => {
        const col = devColumns.find(c => c.COLUMN_NAME === name);
        console.log(`  - ${name}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA || ''}`);
      });
    }
    
    // Columnas en PROD que no están en DEV
    const missingInDev = prodColumnNames.filter(name => !devColumnNames.includes(name));
    if (missingInDev.length > 0) {
      console.log('⚠️  Columnas en PRODUCCIÓN que no están en DESARROLLO:');
      missingInDev.forEach(name => {
        const col = prodColumns.find(c => c.COLUMN_NAME === name);
        console.log(`  - ${name}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA || ''}`);
      });
    }
    
    // Columnas con diferencias en tipo/propiedades
    const commonColumns = devColumnNames.filter(name => prodColumnNames.includes(name));
    const differentColumns = [];
    
    commonColumns.forEach(name => {
      const devCol = devColumns.find(c => c.COLUMN_NAME === name);
      const prodCol = prodColumns.find(c => c.COLUMN_NAME === name);
      
      if (devCol.DATA_TYPE !== prodCol.DATA_TYPE || 
          devCol.IS_NULLABLE !== prodCol.IS_NULLABLE || 
          devCol.COLUMN_DEFAULT !== prodCol.COLUMN_DEFAULT ||
          devCol.EXTRA !== prodCol.EXTRA) {
        differentColumns.push({ name, dev: devCol, prod: prodCol });
      }
    });
    
    if (differentColumns.length > 0) {
      console.log('🔄 Columnas con diferencias:');
      differentColumns.forEach(({ name, dev, prod }) => {
        console.log(`  - ${name}:`);
        console.log(`    DEV:  ${dev.DATA_TYPE} ${dev.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${dev.COLUMN_DEFAULT ? `DEFAULT ${dev.COLUMN_DEFAULT}` : ''} ${dev.EXTRA || ''}`);
        console.log(`    PROD: ${prod.DATA_TYPE} ${prod.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${prod.COLUMN_DEFAULT ? `DEFAULT ${prod.COLUMN_DEFAULT}` : ''} ${prod.EXTRA || ''}`);
      });
    }
    
    if (missingInProd.length === 0 && missingInDev.length === 0 && differentColumns.length === 0) {
      console.log('✅ Las estructuras son idénticas');
    }
    
    // Verificar datos de ejemplo
    console.log('\n=== DATOS DE MUESTRA ===');
    
    const [devCount] = await devConnection.execute('SELECT COUNT(*) as total FROM vacaciones_solicitadas');
    const [prodCount] = await prodConnection.execute('SELECT COUNT(*) as total FROM vacaciones_solicitadas');
    
    console.log(`Registros en DEV: ${devCount[0].total}`);
    console.log(`Registros en PROD: ${prodCount[0].total}`);
    
    if (devCount[0].total > 0) {
      console.log('\n📋 Últimos 3 registros en DEV:');
      const [devSample] = await devConnection.execute(`
        SELECT id, usuario_id, fecha_inicio, fecha_fin, estado, fecha_solicitud 
        FROM vacaciones_solicitadas 
        ORDER BY id DESC 
        LIMIT 3
      `);
      devSample.forEach(record => {
        console.log(`  ID: ${record.id}, Usuario: ${record.usuario_id}, Estado: ${record.estado}, Fecha: ${record.fecha_solicitud}`);
      });
    }
    
    if (prodCount[0].total > 0) {
      console.log('\n📋 Últimos 3 registros en PROD:');
      const [prodSample] = await prodConnection.execute(`
        SELECT id, usuario_id, fecha_inicio, fecha_fin, estado, fecha_solicitud 
        FROM vacaciones_solicitadas 
        ORDER BY id DESC 
        LIMIT 3
      `);
      prodSample.forEach(record => {
        console.log(`  ID: ${record.id}, Usuario: ${record.usuario_id}, Estado: ${record.estado}, Fecha: ${record.fecha_solicitud}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    if (devConnection) await devConnection.end();
    if (prodConnection) await prodConnection.end();
    console.log('\n🔌 Conexiones cerradas');
  }
}

// Ejecutar comparación
compareTableStructures();