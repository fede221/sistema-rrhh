const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env', quiet: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: 'utf8mb4',
  connectionLimit: 5
});

async function cargarVacaciones() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const anio = new Date().getFullYear();
    const diasVacaciones = 15;
    
    console.log(`\n📅 Cargando ${diasVacaciones} días de vacaciones para todos los usuarios (Año ${anio})\n`);
    
    // 1. Obtener todos los usuarios activos
    const [usuarios] = await connection.query(
      'SELECT id, nombre, apellido FROM usuarios WHERE activo = 1 AND rol != "admin_sistema"'
    );
    
    console.log(`✅ Encontrados ${usuarios.length} usuarios activos\n`);
    
    let cargados = 0;
    let errores = 0;
    
    for (const usuario of usuarios) {
      try {
        // Verificar si ya existe registro para este año
        const [existente] = await connection.query(
          'SELECT id FROM vacaciones_anuales WHERE usuario_id = ? AND anio = ?',
          [usuario.id, anio]
        );
        
        if (existente.length > 0) {
          console.log(`⏭️  ${usuario.nombre} ${usuario.apellido} (ID: ${usuario.id}) - Ya tiene asignación para ${anio}`);
          continue;
        }
        
        // Crear registro de vacaciones
        const insertQuery = `
          INSERT INTO vacaciones_anuales 
          (usuario_id, anio, dias_correspondientes, dias_acumulados_previos, dias_no_tomados_anio_anterior)
          VALUES (?, ?, ?, 0, 0)
        `;
        
        await connection.query(insertQuery, [usuario.id, anio, diasVacaciones]);
        
        console.log(`✅ ${usuario.nombre} ${usuario.apellido} (ID: ${usuario.id}) - ${diasVacaciones} días cargados`);
        cargados++;
        
      } catch (err) {
        console.error(`❌ Error al cargar para ${usuario.nombre} ${usuario.apellido}: ${err.message}`);
        errores++;
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Cargados exitosamente: ${cargados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   ⏭️  Ya tenían asignación: ${usuarios.length - cargados - errores}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

cargarVacaciones();
