// Script de prueba para verificar la conversión de fechas de Excel

// Función ANTERIOR (con problema)
function excelDateToStringOLD(excelDate) {
  if (!excelDate || isNaN(excelDate)) return null;
  const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Función NUEVA (corregida)
function excelDateToStringNEW(excelDate) {
  if (!excelDate || isNaN(excelDate)) return null;
  
  // Excel fecha serial: días desde 1900-01-01 (pero Excel piensa que 1900 es bisiesto)
  // Ajuste para el bug de Excel: restar 1 si es después del 29/02/1900
  let adjustedDate = excelDate;
  if (excelDate > 60) {
    adjustedDate = excelDate - 1; // Corrección por el bug del año bisiesto de 1900
  }
  
  // Convertir a milisegundos desde epoch Unix
  // 25569 es el número serial de Excel para 1970-01-01
  const date = new Date((adjustedDate - 25569) * 86400 * 1000);
  
  // Usar métodos UTC para evitar problemas con zona horaria
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

console.log('🧪 Prueba de conversión de fechas Excel\n');
console.log('═══════════════════════════════════════════════════\n');

// Fecha de ejemplo: 12/07/2021 en formato Excel
// Excel cuenta días desde 01/01/1900
// 12/07/2021 = 44393 días desde 01/01/1900

const testDates = [
  { excel: 44393, expected: '2021-07-12', description: '12/07/2021' },
  { excel: 44394, expected: '2021-07-13', description: '13/07/2021' },
  { excel: 44773, expected: '2022-07-27', description: '27/07/2022' },
  { excel: 44956, expected: '2023-01-26', description: '26/01/2023' },
];

console.log('Zona horaria del sistema:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Offset UTC:', new Date().getTimezoneOffset() / 60, 'horas\n');

testDates.forEach(test => {
  const oldResult = excelDateToStringOLD(test.excel);
  const newResult = excelDateToStringNEW(test.excel);
  
  console.log(`Fecha: ${test.description} (Excel: ${test.excel})`);
  console.log(`  Esperado:    ${test.expected}`);
  console.log(`  Método OLD:  ${oldResult} ${oldResult === test.expected ? '✅' : '❌'}`);
  console.log(`  Método NEW:  ${newResult} ${newResult === test.expected ? '✅' : '❌'}`);
  console.log();
});

console.log('═══════════════════════════════════════════════════');
console.log('\n📋 CONCLUSIÓN:');
console.log('Si ves ❌ en "Método OLD", significa que el problema existe.');
console.log('Si ves ✅ en "Método NEW", significa que la corrección funciona.');
