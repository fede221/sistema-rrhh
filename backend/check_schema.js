const db = require('./config/db');

console.log('🔍 Verificando estructura de tabla vacaciones_solicitadas...');

db.query('DESCRIBE vacaciones_solicitadas', (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log('📋 Estructura actual de la tabla:');
    console.table(results);
    
    // Verificar si faltan columnas críticas
    const columnNames = results.map(r => r.Field);
    const requiredColumns = [
      'id', 'usuario_id', 'fecha_inicio', 'fecha_fin', 'dias_solicitados', 
      'estado', 'comentarios_empleado', 'referente_id', 'referente_comentario', 
      'fecha_referente', 'rh_id', 'rh_comentario', 'fecha_rh', 'created_at', 'anio'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Columnas faltantes:', missingColumns);
    } else {
      console.log('✅ Todas las columnas necesarias están presentes');
    }
  }
  
  process.exit();
});