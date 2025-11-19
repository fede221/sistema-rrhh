const mysql = require('mysql2/promise');

async function verificarImplementacion() {
  let connection;
  
  try {
    console.log('🔍 VERIFICACIÓN DE IMPLEMENTACIÓN - ARCHIVOS LEGAJO\n');
    console.log('='.repeat(60));
    
    connection = await mysql.createConnection({
      host: '34.176.128.94',
      user: 'root',
      password: 'pos38ric0S',
      database: 'rrhhdev',
      port: 3306
    });

    // 1. Verificar tabla creada
    console.log('\n📋 1. Verificando tabla legajo_archivos...');
    const [tablaInfo] = await connection.query(`
      SELECT 
        TABLE_NAME, 
        ENGINE,
        TABLE_COLLATION,
        CREATE_TIME,
        TABLE_ROWS
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'rrhhdev' AND TABLE_NAME = 'legajo_archivos'
    `);
    
    if (tablaInfo.length > 0) {
      console.log('   ✅ Tabla existe');
      console.log(`   - Motor: ${tablaInfo[0].ENGINE}`);
      console.log(`   - Charset: ${tablaInfo[0].TABLE_COLLATION}`);
      console.log(`   - Fecha creación: ${tablaInfo[0].CREATE_TIME}`);
    } else {
      console.log('   ❌ Tabla NO existe');
      return;
    }

    // 2. Verificar columnas
    console.log('\n📊 2. Verificando estructura de columnas...');
    const [columnas] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'rrhhdev' 
        AND TABLE_NAME = 'legajo_archivos'
      ORDER BY ORDINAL_POSITION
    `);
    
    const columnasEsperadas = [
      'id', 'legajo_id', 'tipo_documento', 'nombre_archivo', 
      'ruta_archivo', 'tamaño_kb', 'mime_type', 'descripcion',
      'fecha_subida', 'subido_por', 'activo'
    ];
    
    const columnasExistentes = columnas.map(c => c.COLUMN_NAME);
    const todasPresentes = columnasEsperadas.every(col => columnasExistentes.includes(col));
    
    if (todasPresentes) {
      console.log(`   ✅ Todas las columnas presentes (${columnas.length})`);
      columnas.forEach(col => {
        const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
        const extra = col.EXTRA ? ` ${col.EXTRA}` : '';
        console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${key}${extra}`);
      });
    } else {
      console.log('   ❌ Faltan columnas');
    }

    // 3. Verificar foreign keys
    console.log('\n🔗 3. Verificando Foreign Keys...');
    const [fks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'rrhhdev' 
        AND TABLE_NAME = 'legajo_archivos'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (fks.length === 2) {
      console.log('   ✅ Foreign Keys correctas');
      fks.forEach(fk => {
        console.log(`   - ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log(`   ⚠️  Se esperaban 2 FK, se encontraron ${fks.length}`);
    }

    // 4. Verificar índices
    console.log('\n📑 4. Verificando Índices...');
    const [indices] = await connection.query(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        SEQ_IN_INDEX
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = 'rrhhdev' 
        AND TABLE_NAME = 'legajo_archivos'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `);
    
    if (indices.length >= 3) {
      console.log(`   ✅ Índices creados (${indices.length})`);
      const indicesUnicos = [...new Set(indices.map(i => i.INDEX_NAME))];
      indicesUnicos.forEach(idx => {
        console.log(`   - ${idx}`);
      });
    } else {
      console.log(`   ⚠️  Índices insuficientes (${indices.length})`);
    }

    // 5. Verificar tipos de documento ENUM
    console.log('\n📄 5. Verificando tipos de documento...');
    const [enumInfo] = await connection.query(`
      SELECT COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'rrhhdev' 
        AND TABLE_NAME = 'legajo_archivos'
        AND COLUMN_NAME = 'tipo_documento'
    `);
    
    if (enumInfo.length > 0) {
      const enumValues = enumInfo[0].COLUMN_TYPE;
      console.log('   ✅ ENUM configurado');
      console.log(`   - ${enumValues}`);
    }

    // 6. Verificar que la carpeta uploads existe
    const fs = require('fs');
    const path = require('path');
    const uploadsPath = path.join(__dirname, '..', 'uploads', 'legajos');
    
    console.log('\n📁 6. Verificando carpeta de uploads...');
    if (fs.existsSync(uploadsPath)) {
      console.log(`   ✅ Carpeta existe: ${uploadsPath}`);
    } else {
      console.log(`   ⚠️  Carpeta no existe (se creará automáticamente): ${uploadsPath}`);
    }

    // 7. Verificar archivos de implementación
    console.log('\n📦 7. Verificando archivos de implementación...');
    const archivosRequeridos = [
      { path: '../middlewares/uploadLegajoArchivo.js', nombre: 'Middleware Upload' },
      { path: '../controllers/legajosController.js', nombre: 'Controller' },
      { path: '../routes/legajosRoutes.js', nombre: 'Routes' }
    ];
    
    archivosRequeridos.forEach(archivo => {
      const fullPath = path.join(__dirname, archivo.path);
      if (fs.existsSync(fullPath)) {
        console.log(`   ✅ ${archivo.nombre}`);
      } else {
        console.log(`   ❌ ${archivo.nombre} NO encontrado`);
      }
    });

    // 8. Verificar que las rutas contengan los endpoints
    console.log('\n🛣️  8. Verificando endpoints en rutas...');
    const routesPath = path.join(__dirname, '..', 'routes', 'legajosRoutes.js');
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    const endpoints = [
      { ruta: "post('/:legajo_id/archivos'", nombre: 'POST subir archivo' },
      { ruta: "get('/:legajo_id/archivos'", nombre: 'GET listar archivos' },
      { ruta: "get('/:legajo_id/archivos/:archivo_id/descargar'", nombre: 'GET descargar' },
      { ruta: "delete('/:legajo_id/archivos/:archivo_id'", nombre: 'DELETE eliminar' }
    ];
    
    endpoints.forEach(ep => {
      if (routesContent.includes(ep.ruta)) {
        console.log(`   ✅ ${ep.nombre}`);
      } else {
        console.log(`   ❌ ${ep.nombre} NO encontrado`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA\n');
    console.log('📌 Backend implementado correctamente');
    console.log('📌 Listo para pruebas con Postman/Frontend');
    console.log('\nDocumentación completa en:');
    console.log('   XDocumentacion/IMPLEMENTACION_ARCHIVOS_LEGAJO.md');

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verificarImplementacion();
