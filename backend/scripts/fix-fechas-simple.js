const db = require('../config/db');

console.log('🔧 Corrigiendo fechas de ingreso del período 10/2025 (método simplificado)...');

async function corregirFechasIngreso() {
  try {
    // Mostrar algunos ejemplos antes de corregir
    console.log('📋 Verificando el problema...');
    
    const beforeQuery = `
      SELECT DocNumero, Nombre, FecIngreso, PeriodoLiquidacion
      FROM recibos_excel_raw 
      WHERE DocNumero IN ('04514258', '06522706', '10145109') 
      ORDER BY DocNumero, PeriodoLiquidacion
    `;
    
    const beforeResult = await new Promise((resolve, reject) => {
      db.query(beforeQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('🔍 Estado ANTES de la corrección:');
    console.table(beforeResult);
    
    // Contar registros a corregir
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM recibos_excel_raw 
      WHERE PeriodoLiquidacion = '10/2025'
    `;
    
    const countResult = await new Promise((resolve, reject) => {
      db.query(countQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('📊 Total de registros del período 10/2025:', countResult[0].total);
    
    // Ejecutar la corrección: sumar 1 día a todas las fechas de ingreso del período 10/2025
    console.log('🔄 Sumando 1 día a todas las fechas de ingreso del período 10/2025...');
    
    const updateQuery = `
      UPDATE recibos_excel_raw 
      SET FecIngreso = DATE_ADD(FecIngreso, INTERVAL 1 DAY)
      WHERE PeriodoLiquidacion = '10/2025'
      AND FecIngreso IS NOT NULL
    `;
    
    const updateResult = await new Promise((resolve, reject) => {
      db.query(updateQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('✅ Registros actualizados:', updateResult.affectedRows);
    
    // Verificar después de la corrección
    const afterResult = await new Promise((resolve, reject) => {
      db.query(beforeQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('🔍 Estado DESPUÉS de la corrección:');
    console.table(afterResult);
    
    // Verificar que no haya más inconsistencias
    const verifyQuery = `
      SELECT COUNT(*) as inconsistencias
      FROM recibos_excel_raw r1
      WHERE r1.PeriodoLiquidacion = '10/2025'
      AND EXISTS (
        SELECT 1 FROM recibos_excel_raw r2
        WHERE r2.DocNumero = r1.DocNumero
        AND r2.PeriodoLiquidacion != '10/2025'
        AND r2.FecIngreso != r1.FecIngreso
      )
    `;
    
    const verifyResult = await new Promise((resolve, reject) => {
      db.query(verifyQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('🔍 Inconsistencias restantes:', verifyResult[0].inconsistencias);
    
    if (verifyResult[0].inconsistencias === 0) {
      console.log('✅ ¡Corrección completada exitosamente! Todas las fechas están ahora consistentes.');
    } else {
      console.log('⚠️  Aún hay algunas inconsistencias. Puede requerir revisión manual.');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    process.exit(1);
  }
}

corregirFechasIngreso();