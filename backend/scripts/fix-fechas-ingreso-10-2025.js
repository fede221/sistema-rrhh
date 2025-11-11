const db = require('../config/db');

console.log('🔧 Corrigiendo fechas de ingreso del período 10/2025...');

async function corregirFechasIngreso() {
  try {
    // Primero verificar cuántos registros necesitan corrección
    const countQuery = `
      SELECT COUNT(*) as total_a_corregir 
      FROM recibos_excel_raw r1 
      WHERE r1.PeriodoLiquidacion = '10/2025' 
      AND EXISTS (
        SELECT 1 FROM recibos_excel_raw r2 
        WHERE r2.DocNumero = r1.DocNumero 
        AND r2.PeriodoLiquidacion != '10/2025' 
        AND r2.FecIngreso != r1.FecIngreso
      )
    `;
    
    const countResult = await new Promise((resolve, reject) => {
      db.query(countQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('📊 Registros que necesitan corrección:', countResult[0].total_a_corregir);
    
    if (countResult[0].total_a_corregir === 0) {
      console.log('✅ No hay registros que corregir.');
      process.exit(0);
    }
    
    // Mostrar algunos ejemplos antes de corregir
    const examplesQuery = `
      SELECT DISTINCT r1.DocNumero, 
             MAX(r1.Nombre) as Nombre,
             MAX(r1.FecIngreso) as fecha_octubre_incorrecta,
             MAX(r2.FecIngreso) as fecha_correcta_otros_periodos
      FROM recibos_excel_raw r1 
      JOIN recibos_excel_raw r2 ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025' 
      AND r2.PeriodoLiquidacion != '10/2025'
      AND r1.FecIngreso != r2.FecIngreso
      GROUP BY r1.DocNumero
      LIMIT 5
    `;
    
    const examples = await new Promise((resolve, reject) => {
      db.query(examplesQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('📋 Ejemplos de fechas incorrectas a corregir:');
    console.table(examples);
    
    // Ejecutar la corrección usando una estrategia diferente
    console.log('🔄 Ejecutando corrección...');
    
    // Crear tabla temporal con las fechas correctas
    const createTempQuery = `
      CREATE TEMPORARY TABLE temp_fechas_correctas AS
      SELECT DISTINCT r1.DocNumero, r2.FecIngreso as fecha_correcta
      FROM recibos_excel_raw r1
      JOIN recibos_excel_raw r2 ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
      AND r2.PeriodoLiquidacion != '10/2025'
      AND r1.FecIngreso != r2.FecIngreso
      GROUP BY r1.DocNumero
    `;
    
    await new Promise((resolve, reject) => {
      db.query(createTempQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('✅ Tabla temporal creada');
    
    // Actualizar usando JOIN con tabla temporal
    const updateQuery = `
      UPDATE recibos_excel_raw r1
      JOIN temp_fechas_correctas tc ON r1.DocNumero = tc.DocNumero
      SET r1.FecIngreso = tc.fecha_correcta
      WHERE r1.PeriodoLiquidacion = '10/2025'
    `;
    
    const updateResult = await new Promise((resolve, reject) => {
      db.query(updateQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('✅ Registros actualizados:', updateResult.affectedRows);
    
    // Verificar algunos casos específicos después de corrección
    const verificationQuery = `
      SELECT DocNumero, Nombre, FecIngreso, PeriodoLiquidacion
      FROM recibos_excel_raw 
      WHERE DocNumero IN ('04514258', '06522706') 
      ORDER BY DocNumero, PeriodoLiquidacion
    `;
    
    const verification = await new Promise((resolve, reject) => {
      db.query(verificationQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('🔍 Verificación después de corrección:');
    console.table(verification);
    
    console.log('✅ Corrección completada exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    process.exit(1);
  }
}

corregirFechasIngreso();