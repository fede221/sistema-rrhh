const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

console.log('🔧 Corrigiendo FecBaseAnt en la base de datos RRHH...');

async function corregirFecBaseAntRRHH() {
  let connection;
  
  try {
    // Crear conexión explícita a la base RRHH
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'RRHH', // Forzar uso de base RRHH
      port: process.env.DB_PORT,
      charset: 'utf8mb4'
    });
    
    console.log('✅ Conectado a la base de datos RRHH');
    console.log(`📍 Host: ${process.env.DB_HOST}, Base: RRHH\n`);
    
    // Paso 1: Verificar un ejemplo ANTES
    console.log('📋 Verificando documento 35242751 ANTES de la corrección...');
    
    const [before] = await connection.query(`
      SELECT DocNumero, Nombre, PeriodoLiquidacion, FecBaseAnt
      FROM recibos_excel_raw
      WHERE DocNumero = '35242751'
      AND PeriodoLiquidacion IN ('08/2025', '09/2025', '10/2025')
      ORDER BY PeriodoLiquidacion
      LIMIT 10
    `);
    
    console.table(before);
    
    // Paso 2: Contar registros afectados
    console.log('\n📊 Contando registros a corregir...');
    
    const [count] = await connection.query(`
      SELECT COUNT(DISTINCT r1.DocNumero) as empleados_afectados,
             COUNT(*) as registros_afectados
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion IN ('08/2025', '09/2025')
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND DATE_ADD(r1.FecBaseAnt, INTERVAL 1 DAY) = r2.FecBaseAnt
    `);
    
    console.log(`📊 Empleados afectados: ${count[0].empleados_afectados}`);
    console.log(`📊 Registros a corregir: ${count[0].registros_afectados}`);
    
    if (count[0].registros_afectados === 0) {
      console.log('\n✅ No hay registros para corregir. La base ya está actualizada.');
      await connection.end();
      process.exit(0);
    }
    
    // Paso 3: Ejecutar la corrección
    console.log('\n🔄 Aplicando corrección: sumando 1 día a FecBaseAnt del período 10/2025...');
    
    const [updateResult] = await connection.query(`
      UPDATE recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      SET r1.FecBaseAnt = DATE_ADD(r1.FecBaseAnt, INTERVAL 1 DAY)
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion IN ('08/2025', '09/2025')
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND DATE_ADD(r1.FecBaseAnt, INTERVAL 1 DAY) = r2.FecBaseAnt
    `);
    
    console.log(`✅ Registros actualizados: ${updateResult.affectedRows}`);
    
    // Paso 4: Verificar el ejemplo DESPUÉS
    console.log('\n📋 Verificando documento 35242751 DESPUÉS de la corrección...');
    
    const [after] = await connection.query(`
      SELECT DocNumero, Nombre, PeriodoLiquidacion, FecBaseAnt
      FROM recibos_excel_raw
      WHERE DocNumero = '35242751'
      AND PeriodoLiquidacion IN ('08/2025', '09/2025', '10/2025')
      ORDER BY PeriodoLiquidacion
      LIMIT 10
    `);
    
    console.table(after);
    
    // Paso 5: Verificar consistencia final
    const [remaining] = await connection.query(`
      SELECT COUNT(DISTINCT r1.DocNumero) as inconsistencias_restantes
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion IN ('08/2025', '09/2025')
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND DATE_ADD(r1.FecBaseAnt, INTERVAL 1 DAY) = r2.FecBaseAnt
    `);
    
    console.log(`\n📊 Inconsistencias restantes: ${remaining[0].inconsistencias_restantes}`);
    
    if (remaining[0].inconsistencias_restantes === 0) {
      console.log('✅ ¡Corrección completada exitosamente en base RRHH!');
    } else {
      console.log('⚠️  Aún hay algunas inconsistencias.');
    }
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

corregirFecBaseAntRRHH();
