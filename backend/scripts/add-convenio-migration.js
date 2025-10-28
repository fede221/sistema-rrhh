#!/usr/bin/env node

/**
 * 🔧 Script de Migración: Agregar campo 'convenio' a tabla 'usuarios'
 * 
 * Uso: node add-convenio-migration.js
 * 
 * Este script:
 * 1. Conecta a la base de datos
 * 2. Agrega la columna 'convenio' a la tabla 'usuarios'
 * 3. Crea un índice para búsquedas rápidas
 * 4. Verifica que la migración fue exitosa
 */

const db = require('../config/db');

console.log('🔄 Iniciando migración: Agregar campo convenio a usuarios...\n');

// Paso 1: Agregar la columna convenio
const addColumnSQL = `
  ALTER TABLE usuarios
  ADD COLUMN convenio VARCHAR(20) DEFAULT 'dentro' 
  COMMENT 'Clasificación: dentro/fuera de convenio'
`;

db.query(addColumnSQL, (err, result) => {
  if (err) {
    // Si el error es porque la columna ya existe, continuar
    if (err.message.includes('Duplicate column name') || err.message.includes('already exists')) {
      console.log('⚠️  La columna convenio ya existe en la tabla usuarios');
      proceedWithIndex();
    } else {
      console.error('❌ Error al agregar columna convenio:', err.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Columna convenio agregada exitosamente');
    proceedWithIndex();
  }
});

function proceedWithIndex() {
  // Paso 2: Crear índice
  const createIndexSQL = `
    CREATE INDEX idx_usuarios_convenio ON usuarios(convenio)
  `;

  db.query(createIndexSQL, (err, result) => {
    if (err) {
      // Si el índice ya existe, no es un error crítico
      if (err.message.includes('already exists')) {
        console.log('⚠️  El índice idx_usuarios_convenio ya existe');
      } else if (!err.message.includes('Duplicate')) {
        console.error('⚠️  No se pudo crear el índice (puede ya existir):', err.message);
      }
    } else {
      console.log('✅ Índice idx_usuarios_convenio creado exitosamente');
    }
    
    proceedWithVerification();
  });
}

function proceedWithVerification() {
  // Paso 3: Verificar que la columna existe
  const verifySQL = `
    SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'convenio'
  `;

  db.query(verifySQL, (err, results) => {
    if (err) {
      console.error('❌ Error al verificar migración:', err.message);
      process.exit(1);
    }

    if (results.length > 0) {
      const column = results[0];
      console.log('\n✅ Migración completada exitosamente!\n');
      console.log('Detalles de la columna:');
      console.log(`  - Nombre: ${column.COLUMN_NAME}`);
      console.log(`  - Tipo: ${column.COLUMN_TYPE}`);
      console.log(`  - Valor por defecto: ${column.COLUMN_DEFAULT}`);
      console.log('\n📊 El campo convenio está listo para usarse en:');
      console.log('  - POST /api/usuarios (crear usuario)');
      console.log('  - PUT /api/usuarios/:id (editar usuario)');
      console.log('  - GET /api/usuarios (listar usuarios)');
    } else {
      console.error('❌ No se encontró la columna convenio después de la migración');
      process.exit(1);
    }

    db.end();
  });
}
