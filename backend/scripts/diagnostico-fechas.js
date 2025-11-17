// Script de diagnóstico detallado

function diagnostico(excelDate, expectedDate) {
  console.log(`\n🔍 Diagnóstico para Excel serial: ${excelDate}`);
  console.log(`   Fecha esperada: ${expectedDate}`);
  console.log(`   ─────────────────────────────────────────`);
  
  // Cálculo paso a paso
  const ajustado = excelDate > 60 ? excelDate - 1 : excelDate;
  console.log(`   1. Ajustado (bug 1900):  ${ajustado}`);
  
  const diasDesdeEpoch = ajustado - 25569;
  console.log(`   2. Días desde epoch:     ${diasDesdeEpoch}`);
  
  const milisegundos = diasDesdeEpoch * 86400 * 1000;
  console.log(`   3. Milisegundos:         ${milisegundos}`);
  
  const date = new Date(milisegundos);
  console.log(`   4. Date object:          ${date.toISOString()}`);
  console.log(`   5. Date UTC:             ${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`);
  console.log(`   6. Date Local:           ${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`);
  console.log(`   7. Timezone offset:      ${date.getTimezoneOffset()} minutos`);
}

// 12/07/2021 debería ser 44393 en Excel
diagnostico(44393, '2021-07-12');

// Vamos a calcular al revés para verificar
console.log('\n\n📐 Cálculo inverso: ¿Qué número de Excel debería ser 2021-07-12?');
const target = new Date('2021-07-12T12:00:00Z'); // Usar mediodía UTC para evitar problemas
const epochDays = Math.floor(target.getTime() / (86400 * 1000));
const excelDays = epochDays + 25569 + 1; // +1 por el bug de 1900
console.log(`   Fecha: ${target.toISOString()}`);
console.log(`   Días desde epoch Unix: ${epochDays}`);
console.log(`   Número Excel calculado: ${excelDays}`);
