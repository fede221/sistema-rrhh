const db = require('../config/db');

console.log('🔍 Buscando ejemplos específicos de FecBaseAnt...');

async function buscarEjemplos() {
  try {
    // Buscar un empleado que tenga registros en varios períodos
    console.log('📋 Buscando empleados con FecBaseAnt = 12/07/2021 en períodos anteriores...');
    
    const query = `
      SELECT 
        DocNumero,
        Nombre,
        PeriodoLiquidacion,
        FecBaseAnt,
        FecIngreso
      FROM recibos_excel_raw
      WHERE FecBaseAnt = '2021-07-12'
      ORDER BY DocNumero, PeriodoLiquidacion
      LIMIT 30
    `;
    
    const result = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n🔍 Registros con FecBaseAnt = 2021-07-12:');
    console.table(result);
    
    // Si encontramos algún empleado, buscar todos sus períodos
    if (result.length > 0) {
      const docNumero = result[0].DocNumero;
      console.log(`\n📋 Buscando todos los períodos del empleado ${docNumero}...`);
      
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
      
      console.log('\n🔍 Todos los períodos del empleado:');
      console.table(allPeriods);
    }
    
    // Buscar si hay algún caso con FecBaseAnt = 11/07/2021 en 10/2025
    console.log('\n📋 Buscando registros con FecBaseAnt = 11/07/2021 en período 10/2025...');
    
    const query2 = `
      SELECT 
        DocNumero,
        Nombre,
        PeriodoLiquidacion,
        FecBaseAnt,
        FecIngreso
      FROM recibos_excel_raw
      WHERE FecBaseAnt = '2021-07-11'
      AND PeriodoLiquidacion = '10/2025'
      LIMIT 10
    `;
    
    const result2 = await new Promise((resolve, reject) => {
      db.query(query2, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('\n🔍 Registros con FecBaseAnt = 2021-07-11 en 10/2025:');
    console.table(result2);
    
    // Si encontramos alguno, buscar sus otros períodos
    if (result2.length > 0) {
      const docNumero2 = result2[0].DocNumero;
      console.log(`\n📋 Verificando otros períodos del empleado ${docNumero2}...`);
      
      const allPeriodsQuery2 = `
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
      
      const allPeriods2 = await new Promise((resolve, reject) => {
        db.query(allPeriodsQuery2, [docNumero2], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      console.log('\n🔍 Todos los períodos del empleado:');
      console.table(allPeriods2);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la búsqueda:', error);
    process.exit(1);
  }
}

buscarEjemplos();
