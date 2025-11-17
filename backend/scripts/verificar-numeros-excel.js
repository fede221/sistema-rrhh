// Convertir fechas conocidas a números Excel correctos

function dateToExcelSerial(dateString) {
  const date = new Date(dateString + 'T00:00:00Z');
  const epochDays = Math.floor(date.getTime() / (86400 * 1000));
  const excelDays = epochDays + 25569 + 1; // +1 por bug de 1900
  return excelDays;
}

function excelSerialToDate(excelDate) {
  if (!excelDate || isNaN(excelDate)) return null;
  
  let adjustedDate = excelDate;
  if (excelDate > 60) {
    adjustedDate = excelDate - 1;
  }
  
  const date = new Date((adjustedDate - 25569) * 86400 * 1000);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

console.log('🔢 Números Excel CORRECTOS para cada fecha:\n');

const testFechas = [
  '2021-07-11',
  '2021-07-12',
  '2021-07-13',
];

testFechas.forEach(fecha => {
  const excelNum = dateToExcelSerial(fecha);
  const convertida = excelSerialToDate(excelNum);
  const match = convertida === fecha ? '✅' : '❌';
  console.log(`${fecha} → Excel: ${excelNum} → Convertida: ${convertida} ${match}`);
});

console.log('\n\n🔍 Si en tu Excel ves 44393 para 2021-07-12...');
console.log('Entonces Excel NO está usando el número correcto.');
console.log('El número correcto debería ser:', dateToExcelSerial('2021-07-12'));
console.log('\nPero 44393 se convierte a:', excelSerialToDate(44393));
