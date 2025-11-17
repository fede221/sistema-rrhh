const db = require('../config/db');

console.log('🔧 Corrigiendo FecBaseAnt del período 10/2025...');

async function corregirFecBaseAnt() {
  try {
    // Paso 1: Contar cuántos registros tienen el problema
    console.log('📋 Analizando el alcance del problema...');
    
    const countQuery = `
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
    `;
    
    const countResult = await new Promise((resolve, reject) => {
      db.query(countQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('📊 Empleados afectados:', countResult[0].empleados_afectados);
    console.log('📊 Registros a corregir:', countResult[0].registros_afectados);
    
    // Mostrar algunos ejemplos ANTES
    const exampleQuery = `
      SELECT r1.DocNumero, r1.Nombre, r1.FecBaseAnt as FecBaseAnt_10_2025, r2.FecBaseAnt as FecBaseAnt_09_2025
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion = '09/2025'
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND DATE_ADD(r1.FecBaseAnt, INTERVAL 1 DAY) = r2.FecBaseAnt
      LIMIT 5
    `;
    
    const examplesBefore = await new Promise((resolve, reject) => {
      db.query(exampleQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n🔍 Ejemplos ANTES de la corrección:');
    console.table(examplesBefore);
    
    // Paso 2: Ejecutar la corrección
    console.log('\n🔄 Aplicando corrección: sumando 1 día a FecBaseAnt del período 10/2025...');
    
    const updateQuery = `
      UPDATE recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      SET r1.FecBaseAnt = DATE_ADD(r1.FecBaseAnt, INTERVAL 1 DAY)
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion IN ('08/2025', '09/2025')
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND DATE_ADD(r1.FecBaseAnt, INTERVAL 1 DAY) = r2.FecBaseAnt
    `;
    
    const updateResult = await new Promise((resolve, reject) => {
      db.query(updateQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('✅ Registros actualizados:', updateResult.affectedRows);
    
    // Paso 3: Verificar algunos ejemplos DESPUÉS
    const examplesAfter = await new Promise((resolve, reject) => {
      db.query(exampleQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n🔍 Ejemplos DESPUÉS de la corrección:');
    if (examplesAfter.length === 0) {
      console.log('✅ ¡Perfecto! Ya no hay inconsistencias.');
    } else {
      console.table(examplesAfter);
    }
    
    // Paso 4: Verificar empleados específicos
    console.log('\n📋 Verificando empleados específicos...');
    
    const verifyQuery = `
      SELECT DocNumero, Nombre, PeriodoLiquidacion, FecBaseAnt
      FROM recibos_excel_raw
      WHERE DocNumero IN ('40784053', '35242751')
      AND PeriodoLiquidacion IN ('08/2025', '09/2025', '10/2025')
      ORDER BY DocNumero, PeriodoLiquidacion
      LIMIT 10
    `;
    
    const verifyResult = await new Promise((resolve, reject) => {
      db.query(verifyQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('🔍 Verificación de empleados específicos:');
    console.table(verifyResult);
    
    // Paso 5: Contar inconsistencias restantes
    const remainingQuery = `
      SELECT COUNT(DISTINCT r1.DocNumero) as inconsistencias_restantes
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion IN ('08/2025', '09/2025')
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND r1.FecBaseAnt != r2.FecBaseAnt
    `;
    
    const remainingResult = await new Promise((resolve, reject) => {
      db.query(remainingQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n📊 Inconsistencias restantes:', remainingResult[0].inconsistencias_restantes);
    
    if (remainingResult[0].inconsistencias_restantes === 0) {
      console.log('✅ ¡Corrección completada exitosamente! Todas las FecBaseAnt están ahora consistentes.');
    } else {
      console.log('⚠️  Aún hay algunas inconsistencias. Puede requerir revisión adicional.');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    process.exit(1);
  }
}

corregirFecBaseAnt();
