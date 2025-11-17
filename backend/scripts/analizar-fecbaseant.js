const db = require('../config/db');

console.log('🔍 Analizando problema de FecBaseAnt en período 10/2025...');

async function analizarFecBaseAnt() {
  try {
    // Buscar ejemplos de empleados con diferencias en FecBaseAnt
    console.log('📋 Buscando empleados con diferencias en FecBaseAnt...');
    
    const query = `
      SELECT 
        r1.DocNumero,
        r1.Nombre,
        r1.PeriodoLiquidacion as Periodo_Oct2025,
        r1.FecBaseAnt as FecBaseAnt_Oct2025,
        r2.PeriodoLiquidacion as Periodo_Sep2025,
        r2.FecBaseAnt as FecBaseAnt_Sep2025,
        DATEDIFF(r2.FecBaseAnt, r1.FecBaseAnt) as Dias_Diferencia
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion = '9/2025'
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND r1.FecBaseAnt != r2.FecBaseAnt
      ORDER BY r1.DocNumero
      LIMIT 20
    `;
    
    const result = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n🔍 Ejemplos de inconsistencias encontradas:');
    console.table(result);
    
    // Contar total de registros con problema
    const countQuery = `
      SELECT COUNT(DISTINCT r1.DocNumero) as total_afectados
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion = '9/2025'
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND r1.FecBaseAnt != r2.FecBaseAnt
    `;
    
    const countResult = await new Promise((resolve, reject) => {
      db.query(countQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n📊 Total de empleados afectados:', countResult[0].total_afectados);
    
    // Verificar si el problema es de 1 día exactamente
    const patternQuery = `
      SELECT 
        DATEDIFF(r2.FecBaseAnt, r1.FecBaseAnt) as Dias_Diferencia,
        COUNT(*) as Cantidad
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion = '9/2025'
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND r1.FecBaseAnt != r2.FecBaseAnt
      GROUP BY DATEDIFF(r2.FecBaseAnt, r1.FecBaseAnt)
    `;
    
    const patternResult = await new Promise((resolve, reject) => {
      db.query(patternQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n📊 Patrón de diferencias (en días):');
    console.table(patternResult);
    
    // Verificar cuántos registros de 10/2025 tienen FecBaseAnt
    const totalQuery = `
      SELECT COUNT(*) as total_10_2025
      FROM recibos_excel_raw
      WHERE PeriodoLiquidacion = '10/2025'
      AND FecBaseAnt IS NOT NULL
    `;
    
    const totalResult = await new Promise((resolve, reject) => {
      db.query(totalQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n📊 Total de registros en 10/2025 con FecBaseAnt:', totalResult[0].total_10_2025);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
    process.exit(1);
  }
}

analizarFecBaseAnt();
