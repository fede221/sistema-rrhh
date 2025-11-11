const db = require('../config/db');

console.log('🔍 Investigando las 89 inconsistencias restantes...');

async function investigarInconsistencias() {
  try {
    // Obtener los casos que aún tienen inconsistencias
    const inconsistenciesQuery = `
      SELECT r1.DocNumero, r1.Nombre, r1.FecIngreso as fecha_10_2025, 
             r2.FecIngreso as fecha_otros_periodos, r2.PeriodoLiquidacion as otro_periodo
      FROM recibos_excel_raw r1
      JOIN recibos_excel_raw r2 ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
      AND r2.PeriodoLiquidacion != '10/2025'
      AND r1.FecIngreso != r2.FecIngreso
      LIMIT 10
    `;

    const inconsistencies = await new Promise((resolve, reject) => {
      db.query(inconsistenciesQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('📋 Primeros 10 casos con inconsistencias:');
    console.table(inconsistencies);
    
    // Analizar patrones de las inconsistencias
    const patternsQuery = `
      SELECT 
        DATEDIFF(r2.FecIngreso, r1.FecIngreso) as diferencia_dias,
        COUNT(*) as cantidad_casos
      FROM recibos_excel_raw r1
      JOIN recibos_excel_raw r2 ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
      AND r2.PeriodoLiquidacion != '10/2025'
      AND r1.FecIngreso != r2.FecIngreso
      GROUP BY DATEDIFF(r2.FecIngreso, r1.FecIngreso)
      ORDER BY cantidad_casos DESC
    `;
    
    const patterns = await new Promise((resolve, reject) => {
      db.query(patternsQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('📊 Patrones de diferencias en días:');
    console.table(patterns);
    
    // Ver si hay empleados con múltiples fechas de ingreso diferentes
    const multiDatesQuery = `
      SELECT r1.DocNumero, r1.Nombre,
             COUNT(DISTINCT r2.FecIngreso) as fechas_diferentes,
             r1.FecIngreso as fecha_actual_10_2025,
             GROUP_CONCAT(DISTINCT r2.PeriodoLiquidacion ORDER BY r2.PeriodoLiquidacion) as periodos_otros,
             GROUP_CONCAT(DISTINCT DATE_FORMAT(r2.FecIngreso, '%Y-%m-%d') ORDER BY r2.FecIngreso) as fechas_otros
      FROM recibos_excel_raw r1
      JOIN recibos_excel_raw r2 ON r1.DocNumero = r2.DocNumero
      WHERE r1.PeriodoLiquidacion = '10/2025'
      AND r2.PeriodoLiquidacion != '10/2025'
      AND r1.FecIngreso != r2.FecIngreso
      GROUP BY r1.DocNumero, r1.Nombre, r1.FecIngreso
      ORDER BY fechas_diferentes DESC
      LIMIT 8
    `;
    
    const multiDates = await new Promise((resolve, reject) => {
      db.query(multiDatesQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('🔄 Empleados con múltiples fechas de ingreso en otros períodos:');
    console.table(multiDates);
    
    // Verificar si hay casos de empleados que cambiaron de empresa
    const empresaChangesQuery = `
      SELECT DISTINCT r1.DocNumero, r1.Nombre, r1.FecIngreso as fecha_10_2025,
             e1.nombre as empresa_10_2025, e2.nombre as empresa_otros_periodos,
             r2.PeriodoLiquidacion as otro_periodo, r2.FecIngreso as fecha_otros
      FROM recibos_excel_raw r1
      LEFT JOIN legajos l1 ON r1.DocNumero = l1.nro_documento AND r1.Legajo = l1.numero_legajo
      LEFT JOIN empresas e1 ON l1.empresa_id = e1.id
      JOIN recibos_excel_raw r2 ON r1.DocNumero = r2.DocNumero
      LEFT JOIN legajos l2 ON r2.DocNumero = l2.nro_documento AND r2.Legajo = l2.numero_legajo
      LEFT JOIN empresas e2 ON l2.empresa_id = e2.id
      WHERE r1.PeriodoLiquidacion = '10/2025'
      AND r2.PeriodoLiquidacion != '10/2025'
      AND r1.FecIngreso != r2.FecIngreso
      AND (e1.id != e2.id OR e1.id IS NULL OR e2.id IS NULL)
      LIMIT 5
    `;
    
    const empresaChanges = await new Promise((resolve, reject) => {
      db.query(empresaChangesQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('🏢 Empleados que pueden haber cambiado de empresa:');
    console.table(empresaChanges);
    
    console.log('✅ Análisis completado');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
    process.exit(1);
  }
}

investigarInconsistencias();