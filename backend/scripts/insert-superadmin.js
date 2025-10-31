#!/usr/bin/env node

/**
 * Script para insertar un usuario SUPERADMIN en la base de datos
 * Uso: node scripts/insert-superadmin.js [opciones]
 * 
 * Opciones:
 *   --legajo=CODE        Código de legajo (default: SUPER001)
 *   --dni=DNI            DNI del usuario (default: 99999999) - REQUERIDO PARA LOGIN
 *   --nombre=NAME        Nombre (default: Super)
 *   --apellido=LASTNAME  Apellido (default: Admin)
 *   --correo=EMAIL       Email (default: superadmin@sistema.local)
 *   --password=PASS      Contraseña (default: SuperAdmin123!)
 *   --convenio=VALUE     Convenio: dentro/fuera (default: dentro)
 * 
 * Ejemplo:
 *   node scripts/insert-superadmin.js --legajo=SA001 --dni=12345678 --password=MiContraseña123
 */

const db = require('../config/db');
const bcrypt = require('bcrypt');

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  legajo: 'SUPER001',
  dni: '99999999',
  nombre: 'Super',
  apellido: 'Admin',
  correo: 'superadmin@sistema.local',
  password: 'Royal123!',
  convenio: 'dentro',
  activo: 1
};

// Override defaults with provided arguments
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    if (value !== undefined) {
      config[key] = value;
    }
  }
});

async function insertSuperAdmin() {
  try {
    // Validate required fields
    if (!config.legajo || !config.dni || !config.correo) {
      console.error('❌ Error: Faltan campos requeridos (legajo, dni, correo)');
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.correo)) {
      console.error('❌ Error: Formato de email inválido');
      process.exit(1);
    }

    // Validate convenio value
    if (!['dentro', 'fuera'].includes(config.convenio)) {
      console.error('❌ Error: Convenio debe ser "dentro" o "fuera"');
      process.exit(1);
    }

    console.log('🔐 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(config.password, 10);

    // Check if user already exists
    const checkQuery = 'SELECT id FROM usuarios WHERE dni = ? OR correo = ? LIMIT 1';
    
    db.query(checkQuery, [config.dni, config.correo], (err, results) => {
      if (err) {
        console.error('❌ Error al verificar usuario existente:', err.message);
        process.exit(1);
      }

      if (results.length > 0) {
        console.error('❌ Error: Ya existe un usuario con este DNI o correo');
        process.exit(1);
      }

      // Insert superadmin user
      const insertQuery = `
        INSERT INTO usuarios 
        (legajo, dni, nombre, apellido, correo, password, rol, activo, convenio, fecha_ingreso)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const userData = [
        config.legajo,
        config.dni,
        config.nombre,
        config.apellido,
        config.correo,
        hashedPassword,
        'superadmin',
        config.activo,
        config.convenio
      ];

      db.query(insertQuery, userData, (err, result) => {
        if (err) {
          console.error('❌ Error al crear superadmin:', err.message);
          process.exit(1);
        }

        console.log('\n✅ SUPERADMIN CREADO EXITOSAMENTE\n');
        console.log('📋 Detalles del Usuario:');
        console.log('─'.repeat(50));
        console.log(`  ID:           ${result.insertId}`);
        console.log(`  Legajo:       ${config.legajo}`);
        console.log(`  DNI:          ${config.dni}`);
        console.log(`  Nombre:       ${config.nombre} ${config.apellido}`);
        console.log(`  Correo:       ${config.correo}`);
        console.log(`  Rol:          superadmin`);
        console.log(`  Convenio:     ${config.convenio}`);
        console.log(`  Activo:       ${config.activo ? 'Sí' : 'No'}`);
        console.log('─'.repeat(50));
        console.log('\n🔑 Credenciales de Acceso:');
        console.log('─'.repeat(50));
        console.log(`  Correo:       ${config.correo}`);
        console.log(`  Contraseña:   ${config.password}`);
        console.log('─'.repeat(50));
        console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro');
        console.log('💡 Se recomienda cambiar la contraseña en el primer acceso\n');

        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    process.exit(1);
  }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Script para insertar un SUPERADMIN

Uso: node scripts/insert-superadmin.js [opciones]

Opciones:
  --legajo=CODE        Código de legajo (default: SUPER001)
  --dni=DNI            DNI del usuario (default: 99999999)
  --nombre=NAME        Nombre (default: Super)
  --apellido=LASTNAME  Apellido (default: Admin)
  --correo=EMAIL       Email (default: superadmin@sistema.local)
  --password=PASS      Contraseña (default: SuperAdmin123!)
  --convenio=VALUE     Convenio: dentro/fuera (default: dentro)

Ejemplos:
  # Crear con valores por defecto
  node scripts/insert-superadmin.js

  # Crear con valores personalizados
  node scripts/insert-superadmin.js --legajo=SA001 --correo=admin@empresa.com

  # Con contraseña personalizada
  node scripts/insert-superadmin.js --password="MiContraseñaSegura123"
  `);
  process.exit(0);
}

console.log('🚀 Iniciando inserción de SUPERADMIN...\n');
insertSuperAdmin();
