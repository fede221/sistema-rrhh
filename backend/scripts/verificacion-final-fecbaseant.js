const db = require('../config/db');

console.log('✅ Verificación final de la corrección de FecBaseAnt');

async function verificacionFinal() {
  try {
    // Verificar que los empleados de ejemplo ahora tienen fechas consistentes
    console.log('📋 Verificando empleados de ejemplo...\n');
    
    const ejemplosQuery = `
      SELECT 
        DocNumero,
        MAX(Nombre) as Nombre,
        PeriodoLiquidacion,
        FecBaseAnt
      FROM recibos_excel_raw
      WHERE DocNumero IN ('40784053', '35242751')
      AND PeriodoLiquidacion IN ('08/2025', '09/2025', '10/2025')
      GROUP BY DocNumero, PeriodoLiquidacion, FecBaseAnt
      ORDER BY DocNumero, PeriodoLiquidacion
    `;
    
    const ejemplos = await new Promise((resolve, reject) => {
      db.query(ejemplosQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('🔍 Empleados verificados:');
    console.table(ejemplos);
    
    // Contar empleados con FecBaseAnt consistente
    const consistentesQuery = `
      SELECT COUNT(DISTINCT r1.DocNumero) as empleados_consistentes
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
        AND r2.PeriodoLiquidacion IN ('08/2025', '09/2025')
        AND r1.FecBaseAnt IS NOT NULL
        AND r2.FecBaseAnt IS NOT NULL
        AND r1.FecBaseAnt = r2.FecBaseAnt
    `;
    
    const consistentes = await new Promise((resolve, reject) => {
      db.query(consistentesQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    // Total de empleados con FecBaseAnt en 10/2025
    const totalQuery = `
      SELECT COUNT(DISTINCT DocNumero) as total_empleados
      FROM recibos_excel_raw
      WHERE PeriodoLiquidacion = '10/2025'
      AND FecBaseAnt IS NOT NULL
    `;
    
    const total = await new Promise((resolve, reject) => {
      db.query(totalQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n📊 RESUMEN DE CORRECCIÓN:');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Empleados con FecBaseAnt consistente: ${consistentes[0].empleados_consistentes}`);
    console.log(`📊 Total de empleados en período 10/2025: ${total[0].total_empleados}`);
    console.log(`📈 Porcentaje de consistencia: ${((consistentes[0].empleados_consistentes / total[0].total_empleados) * 100).toFixed(2)}%`);
    console.log('═══════════════════════════════════════════════');
    
    // Buscar empleados que tuvieron el problema del día restado y verificar que se corrigió
    const ejemploCorregidoQuery = `
      SELECT 
        r1.DocNumero,
        MAX(r1.Nombre) as Nombre,
        r1.FecBaseAnt as FecBaseAnt_10_2025,
        r2.FecBaseAnt as FecBaseAnt_09_2025,
        CASE 
          WHEN r1.FecBaseAnt = r2.FecBaseAnt THEN '✅ CORREGIDO'
          ELSE '❌ PROBLEMA'
        END as Estado
      FROM recibos_excel_raw r1
      INNER JOIN recibos_excel_raw r2 
        ON r1.DocNumero = r2.DocNumero
      WHERE r1.DocNumero IN ('40784053', '35242751', '22586568')
      AND r1.PeriodoLiquidacion = '10/2025'
      AND r2.PeriodoLiquidacion = '09/2025'
      GROUP BY r1.DocNumero, r1.FecBaseAnt, r2.FecBaseAnt
    `;
    
    const corregidos = await new Promise((resolve, reject) => {
      db.query(ejemploCorregidoQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n✅ Verificación de casos específicos corregidos:');
    console.table(corregidos);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

verificacionFinal();
