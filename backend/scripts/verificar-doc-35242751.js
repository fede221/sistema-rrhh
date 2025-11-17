const db = require('../config/db');

console.log('🔍 Verificando documento 35242751...');

async function verificarDocumento() {
  try {
    const query = `
      SELECT 
        DocNumero,
        Nombre,
        PeriodoLiquidacion,
        FecBaseAnt,
        FecIngreso
      FROM recibos_excel_raw
      WHERE DocNumero = '35242751'
      ORDER BY PeriodoLiquidacion
    `;
    
    const result = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n📋 Todos los registros del documento 35242751:');
    console.table(result);
    
    // Contar registros por período
    const countQuery = `
      SELECT 
        PeriodoLiquidacion,
        COUNT(*) as cantidad_registros,
        MIN(FecBaseAnt) as FecBaseAnt_Min,
        MAX(FecBaseAnt) as FecBaseAnt_Max
      FROM recibos_excel_raw
      WHERE DocNumero = '35242751'
      GROUP BY PeriodoLiquidacion
      ORDER BY PeriodoLiquidacion
    `;
    
    const countResult = await new Promise((resolve, reject) => {
      db.query(countQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n📊 Resumen por período:');
    console.table(countResult);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarDocumento();
