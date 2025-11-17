const db = require('../config/db');

console.log('🔍 Investigando inconsistencia restante...');

async function investigarInconsistencia() {
  try {
    // Buscar el empleado con inconsistencia
    const query = `
      SELECT 
        r1.DocNumero,
        r1.Nombre,
        r1.PeriodoLiquidacion as Periodo_10_2025,
        r1.FecBaseAnt as FecBaseAnt_10_2025,
        r2.PeriodoLiquidacion as Periodo_Anterior,
        r2.FecBaseAnt as FecBaseAnt_Anterior,
        DATEDIFF(r1.FecBaseAnt, r2.FecBaseAnt) as Dias_Diferencia
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion IN ('08/2025', '09/2025')
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND r1.FecBaseAnt != r2.FecBaseAnt
      LIMIT 10
    `;
    
    const result = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n🔍 Inconsistencias encontradas:');
    console.table(result);
    
    if (result.length > 0) {
      const docNumero = result[0].DocNumero;
      console.log(`\n📋 Analizando todos los períodos del empleado ${docNumero}...`);
      
      const allPeriodsQuery = `
        SELECT 
          DocNumero,
          Nombre,
          PeriodoLiquidacion,
          FecBaseAnt,
          FecIngreso
        FROM recibos_excel_raw
        WHERE DocNumero = ?
        ORDER BY PeriodoLiquidacion
      `;
      
      const allPeriods = await new Promise((resolve, reject) => {
        db.query(allPeriodsQuery, [docNumero], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      console.log('\n🔍 Historial completo del empleado:');
      console.table(allPeriods.slice(0, 30)); // Mostrar primeros 30 registros
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la investigación:', error);
    process.exit(1);
  }
}

investigarInconsistencia();
