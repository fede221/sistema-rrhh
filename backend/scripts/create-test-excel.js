/**
 * Create a test Excel file with sample users for bulk import testing
 * Usage:
 *   node scripts/create-test-excel.js
 */

const XLSX = require('xlsx');
const path = require('path');

function createTestExcel() {
  try {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Sample data - 5 test users
    const data = [
      {
        Codigo: "TEST001",
        Nombre: "JUAN CARLOS",
        Apellido: "PÉREZ GARCÍA",
        DocNro: "25123456",
        EmailPersonal: "juan.perez@example.com",
        DomicilioCalle: "Av. Libertador",
        DomicilioNro: "1234",
        DomicilioPiso: "3",
        DomicilioDepto: "B",
        DomicilioLoc: "Buenos Aires",
        DomicilioCodPos: "1428",
        Telefono: "1145678900",
        CUIL: "20251234568",
        Sexo: "M",
        FecNacimiento: new Date(1985, 6, 15),
        DescEstado: "Soltero",
        NombreProvincia: "Buenos Aires",
        Empresa: "1",
        Convenio: "CCT 123/85"
      },
      {
        Codigo: "TEST002",
        Nombre: "MARÍA",
        Apellido: "RODRÍGUEZ MARTÍNEZ",
        DocNro: "28654321",
        EmailPersonal: "maria.rodriguez@example.com",
        DomicilioCalle: "Calle Rivadavia",
        DomicilioNro: "567",
        DomicilioPiso: "1",
        DomicilioDepto: "A",
        DomicilioLoc: "La Plata",
        DomicilioCodPos: "1900",
        Telefono: "2215678901",
        CUIL: "27286543218",
        Sexo: "F",
        FecNacimiento: new Date(1990, 3, 22),
        DescEstado: "Casada",
        NombreProvincia: "Buenos Aires",
        Empresa: "1",
        Convenio: "CCT 456/90"
      },
      {
        Codigo: "TEST003",
        Nombre: "LUIS FERNANDO",
        Apellido: "GÓMEZ SANTOS",
        DocNro: "29987654",
        EmailPersonal: "luis.gomez@example.com",
        DomicilioCalle: "Av. 9 de Julio",
        DomicilioNro: "2000",
        DomicilioPiso: "5",
        DomicilioDepto: "C",
        DomicilioLoc: "San Isidro",
        DomicilioCodPos: "1642",
        Telefono: "1198765432",
        CUIL: "20299876541",
        Sexo: "M",
        FecNacimiento: new Date(1988, 11, 3),
        DescEstado: "Divorciado",
        NombreProvincia: "Buenos Aires",
        Empresa: "1",
        Convenio: "CCT 789/88"
      },
      {
        Codigo: "TEST004",
        Nombre: "PAULA GABRIELA",
        Apellido: "ACOSTA FLORES",
        DocNro: "27456789",
        EmailPersonal: "paula.acosta@example.com",
        DomicilioCalle: "Calle Florida",
        DomicilioNro: "345",
        DomicilioPiso: "2",
        DomicilioDepto: "D",
        DomicilioLoc: "Avellaneda",
        DomicilioCodPos: "1870",
        Telefono: "1165432109",
        CUIL: "27274567895",
        Sexo: "F",
        FecNacimiento: new Date(1992, 5, 10),
        DescEstado: "Soltera",
        NombreProvincia: "Buenos Aires",
        Empresa: "1",
        Convenio: "CCT 321/92"
      },
      {
        Codigo: "TEST005",
        Nombre: "CARLOS MIGUEL",
        Apellido: "TORRES MENDEZ",
        DocNro: "26789123",
        EmailPersonal: "carlos.torres@example.com",
        DomicilioCalle: "Av. de Mayo",
        DomicilioNro: "789",
        DomicilioPiso: "4",
        DomicilioDepto: "E",
        DomicilioLoc: "Flores",
        DomicilioCodPos: "1405",
        Telefono: "1187654321",
        CUIL: "20267891234",
        Sexo: "M",
        FecNacimiento: new Date(1987, 8, 17),
        DescEstado: "Casado",
        NombreProvincia: "Buenos Aires",
        Empresa: "1",
        Convenio: "CCT 654/87"
      }
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    
    // Output file path
    const outputPath = path.join(__dirname, '..', '..', 'test-usuarios-sample.xlsx');
    
    // Write file
    XLSX.writeFile(wb, outputPath);
    
    console.log(`✅ Test Excel file created: ${outputPath}`);
    console.log(`📊 Contains 5 sample users for testing bulk import`);
    console.log(`\n📋 Users in file:`);
    data.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.Nombre} ${user.Apellido} (${user.DocNro})`);
    });

  } catch (err) {
    console.error('❌ Error creating test Excel:', err);
    process.exit(1);
  }
}

createTestExcel();
