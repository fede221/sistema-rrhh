/**
 * Test bulk import from Excel file
 * Requirements:
 * - Backend running locally on http://localhost:3001
 * - usuariofinalrrhh.xlsx file exists
 * - A superadmin user exists 
 * Usage (PowerShell):
 *   node scripts/test-bulk-import.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET;

// Excel file path
const excelPath = path.join(__dirname, '..', '..', 'usuariofinalrrhh.xlsx');

async function testBulkImport() {
  try {
    // Check if file exists
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found: ${excelPath}`);
    }
    console.log(`✅ Archivo encontrado: ${excelPath}`);

    // Generate superadmin token
    const adminToken = jwt.sign(
      {
        id: 999999,
        rol: 'superadmin',
        dni: '99999999',
        nombre: 'Super',
        apellido: 'Admin'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Token de superadmin generado');

    // Read file
    const fileBuffer = fs.readFileSync(excelPath);
    const fileBase64 = fileBuffer.toString('base64');
    console.log(`📊 Archivo leído: ${fileBuffer.length} bytes, Base64: ${fileBase64.length} caracteres`);

    // Prepare form data
    const formData = new (require('form-data'))();
    formData.append('archivo', fileBuffer, 'usuariofinalrrhh.xlsx');

    // Make request
    console.log('\n🚀 Iniciando importación masiva...\n');
    const res = await fetch(`${API_BASE}/api/usuarios/importar-masivo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });

    const responseText = await res.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    if (!res.ok) {
      console.error(`❌ Error en importación (${res.status}):`, responseBody);
      process.exit(1);
    }

    console.log('✅ Importación completada');
    console.log('\n📊 Resultados:');
    console.log(JSON.stringify(responseBody, null, 2));

    // Check results
    if (responseBody.exitosos > 0) {
      console.log(`\n🎉 ¡${responseBody.exitosos} usuarios importados exitosamente!`);
    }
    if (responseBody.errores && responseBody.errores.length > 0) {
      console.log(`\n❌ ${responseBody.errores.length} errores encontrados:`);
      responseBody.errores.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. Fila ${err.fila}: ${err.mensaje}`);
      });
      if (responseBody.errores.length > 10) {
        console.log(`   ... y ${responseBody.errores.length - 10} errores más`);
      }
    }
    if (responseBody.advertencias && responseBody.advertencias.length > 0) {
      console.log(`\n⚠️ ${responseBody.advertencias.length} advertencias:`);
      responseBody.advertencias.slice(0, 5).forEach((adv, i) => {
        console.log(`   ${i + 1}. Fila ${adv.fila}: ${adv.mensaje}`);
      });
    }

    process.exit(responseBody.errores && responseBody.errores.length > 0 ? 1 : 0);

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

testBulkImport();
