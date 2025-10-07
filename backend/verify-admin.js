const db = require('./config/db');
const bcrypt = require('bcrypt');

console.log('🔍 Verificando credenciales del superadmin...');

db.query('SELECT * FROM usuarios WHERE dni = ?', ['99999999'], (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  if (results.length === 0) {
    console.log('❌ No se encontró usuario con DNI 99999999');
    process.exit(1);
  }
  
  const usuario = results[0];
  console.log('👤 Usuario encontrado:');
  console.log(`   ID: ${usuario.id}`);
  console.log(`   DNI: ${usuario.dni}`);
  console.log(`   Nombre: ${usuario.nombre} ${usuario.apellido}`);
  console.log(`   Correo: ${usuario.correo}`);
  console.log(`   Rol: ${usuario.rol}`);
  console.log(`   Activo: ${usuario.activo}`);
  
  // Verificar password
  const testPassword = 'SuperAdmin2025!';
  bcrypt.compare(testPassword, usuario.password, (err, match) => {
    if (err) {
      console.error('❌ Error al verificar password:', err);
      process.exit(1);
    }
    
    if (match) {
      console.log('✅ Password correcto');
    } else {
      console.log('❌ Password incorrecto');
      
      // Crear hash del password correcto para debug
      bcrypt.hash(testPassword, 10, (err, hash) => {
        if (err) {
          console.error('❌ Error al generar hash:', err);
          process.exit(1);
        }
        console.log('📝 Hash del password correcto:', hash);
        console.log('📝 Hash en base de datos:', usuario.password);
        process.exit(1);
      });
      return;
    }
    
    process.exit(0);
  });
});
