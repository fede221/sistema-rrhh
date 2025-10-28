#!/usr/bin/env node
/**
 * Script para analizar la estructura y potencia de la base de datos
 * Extrae: tablas, columnas, índices, relaciones, tamaños, tipos de datos
 */

require('dotenv').config({ path: __dirname + '/../.env', quiet: true });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

async function main() {
  const pool = mysql.createPool(DB_CONFIG);
  let conn;

  try {
    conn = await pool.getConnection();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║       ANÁLISIS DE POTENCIA - BASE DE DATOS RRHH                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Info General
    console.log('📊 INFORMACIÓN GENERAL DE LA BASE DE DATOS\n');
    const [dbInfo] = await conn.query(`
      SELECT 
        DATABASE() as base_datos,
        @@character_set_database as charset,
        @@collation_database as collation,
        @@sql_mode as sql_mode
    `);
    console.log(`Base de datos: ${dbInfo[0].base_datos}`);
    console.log(`Charset: ${dbInfo[0].charset}`);
    console.log(`Collation: ${dbInfo[0].collation}`);
    console.log(`SQL Mode: ${dbInfo[0].sql_mode}\n`);

    // 2. Estadísticas de Tablas
    console.log('📋 ESTADÍSTICAS DE TABLAS\n');
    const [tables] = await conn.query(`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS,
        ROUND(DATA_LENGTH / 1024 / 1024, 2) as data_mb,
        ROUND(INDEX_LENGTH / 1024 / 1024, 2) as index_mb,
        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_mb,
        ENGINE,
        TABLE_COLLATION
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_ROWS DESC
    `);

    let totalRows = 0;
    let totalSize = 0;

    console.log('┌─ Tabla ─────────────────────── Filas ─ Tamaño ─ Índices ─ Total ─┐');
    tables.forEach(t => {
      totalRows += t.TABLE_ROWS || 0;
      totalSize += parseFloat(t.total_mb) || 0;
      console.log(`│ ${t.TABLE_NAME.padEnd(30)} ${String(t.TABLE_ROWS).padStart(8)} ${String(t.data_mb + ' MB').padStart(9)} ${String(t.index_mb + ' MB').padStart(9)} ${String(t.total_mb + ' MB').padStart(8)} │`);
    });
    console.log(`└─────────────────────────────────────────────────────────────────┘`);
    console.log(`📈 Total: ${totalRows.toLocaleString()} filas | ${totalSize.toFixed(2)} MB\n`);

    // 3. Análisis de Índices
    console.log('🔑 ANÁLISIS DE ÍNDICES\n');
    const [indexes] = await conn.query(`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        COLUMN_NAME,
        SEQ_IN_INDEX,
        NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `);

    const indexMap = {};
    indexes.forEach(idx => {
      const key = idx.TABLE_NAME + '.' + idx.INDEX_NAME;
      if (!indexMap[key]) {
        indexMap[key] = {
          table: idx.TABLE_NAME,
          index: idx.INDEX_NAME,
          columns: [],
          unique: idx.NON_UNIQUE === 0 ? '🔒 UNIQUE' : '📍 Multiple'
        };
      }
      indexMap[key].columns.push(idx.COLUMN_NAME);
    });

    Object.values(indexMap).forEach(idx => {
      console.log(`${idx.unique} ${idx.table}.${idx.index}`);
      console.log(`   Columnas: ${idx.columns.join(', ')}\n`);
    });

    // 4. Tipos de Datos
    console.log('🏗️  DISTRIBUCIÓN DE TIPOS DE DATOS\n');
    const [columnTypes] = await conn.query(`
      SELECT 
        COLUMN_TYPE,
        COUNT(*) as cantidad
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      GROUP BY COLUMN_TYPE
      ORDER BY cantidad DESC
    `);

    columnTypes.forEach(ct => {
      console.log(`  ${ct.COLUMN_TYPE.padEnd(30)} ${ct.cantidad} columnas`);
    });
    console.log('');

    // 5. Relaciones y Constraints
    console.log('🔗 RELACIONES Y CONSTRAINTS\n');
    const [constraints] = await conn.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME,
        CONSTRAINT_TYPE
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() 
      AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME
    `);

    constraints.forEach(c => {
      console.log(`  ${c.TABLE_NAME}.${c.COLUMN_NAME} → ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
    });
    console.log('');

    // 6. Análisis de Potencia
    console.log('⚡ ANÁLISIS DE POTENCIA\n');

    const potency = {
      normalization: 0,
      indexing: 0,
      constraints: 0,
      dataTypes: 0,
      scaling: 0
    };

    // Normalization check
    if (tables.length >= 8) potency.normalization += 30;
    if (totalRows > 10000) potency.normalization += 20;

    // Indexing check
    const totalIndexes = Object.keys(indexMap).length;
    if (totalIndexes > 10) potency.indexing += 35;
    else if (totalIndexes > 5) potency.indexing += 20;

    // Constraints check
    if (constraints.length > 5) potency.constraints += 25;
    if (constraints.length > 2) potency.constraints += 15;

    // Data types check
    if (columnTypes.length > 5) potency.dataTypes += 20;
    potency.dataTypes += 15; // charset utf8mb4

    // Scaling potential
    if (totalSize < 100) potency.scaling += 30;
    potency.scaling += 20;

    const totalScore = Object.values(potency).reduce((a, b) => a + b, 0);

    console.log(`Normalización: ${potency.normalization}/50`);
    console.log(`Indexación: ${potency.indexing}/35`);
    console.log(`Constraints: ${potency.constraints}/25`);
    console.log(`Tipos de datos: ${potency.dataTypes}/20`);
    console.log(`Escalabilidad: ${potency.scaling}/30`);
    console.log(`\n📊 PUNTUACIÓN TOTAL: ${totalScore}/160\n`);

    // Rating
    const rating = (totalScore / 160) * 100;
    let stars = '';
    if (rating >= 90) stars = '⭐⭐⭐⭐⭐ Excelente';
    else if (rating >= 75) stars = '⭐⭐⭐⭐ Muy Buena';
    else if (rating >= 60) stars = '⭐⭐⭐ Buena';
    else if (rating >= 45) stars = '⭐⭐ Moderada';
    else stars = '⭐ Básica';

    console.log(`${stars} (${rating.toFixed(1)}%)\n`);

    // 7. Recomendaciones
    console.log('💡 RECOMENDACIONES\n');

    const recommendations = [];

    if (potency.normalization < 40) {
      recommendations.push('• Considera normalizar más las tablas (3NF o BCNF)');
    }
    if (potency.indexing < 25) {
      recommendations.push('• Agrega más índices en columnas de búsqueda frecuente');
    }
    if (potency.constraints < 20) {
      recommendations.push('• Implementa más constraints de integridad referencial');
    }
    if (totalSize > 100) {
      recommendations.push('• Considera archivar datos antiguos (particionamiento)');
    }
    if (totalRows < 1000) {
      recommendations.push('• La BD está en fase temprana, buen momento para optimizar');
    }

    if (recommendations.length === 0) {
      console.log('✅ La estructura de la BD está bien optimizada.\n');
    } else {
      recommendations.forEach(r => console.log(r));
      console.log('');
    }

    // 8. Características
    console.log('✨ CARACTERÍSTICAS DETECTADAS\n');
    const features = [];
    if (totalIndexes > 5) features.push('✓ Indexación multicolumna');
    if (constraints.length > 0) features.push('✓ Integridad referencial FK');
    if (dbInfo[0].charset === 'utf8mb4') features.push('✓ Unicode completo (UTF-8MB4)');
    if (tables.some(t => t.ENGINE === 'InnoDB')) features.push('✓ Motor InnoDB (transacciones)');
    if (totalSize < 50) features.push('✓ Tamaño compacto (optimizado)');
    if (totalRows > 1000) features.push('✓ Volumen de datos significativo');

    features.forEach(f => console.log(f));
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

main();
