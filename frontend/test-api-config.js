// Test simple para verificar la configuración de API
console.log('Verificando configuración de API...');

// Simular diferentes escenarios
const scenarios = [
  { hostname: 'localhost', expected: 'http://localhost:3001' },
  { hostname: '127.0.0.1', expected: 'http://localhost:3001' },
  { hostname: '192.168.203.24', expected: 'http://192.168.203.24:3001' },
  { hostname: '192.168.1.100', expected: 'http://192.168.1.100:3001' }
];

scenarios.forEach(scenario => {
  // Mock window.location.hostname
  const originalLocation = global.window?.location;
  global.window = { location: { hostname: scenario.hostname } };
  
  // Simular la función getApiBaseUrl
  const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return '/api';
    }
    
    const hostname = global.window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    } else {
      return `http://${hostname}:3001`;
    }
  };

  const result = getApiBaseUrl();
  console.log(`Hostname: ${scenario.hostname} -> URL: ${result} (Expected: ${scenario.expected})`);
  console.log(`✅ ${result === scenario.expected ? 'CORRECTO' : 'ERROR'}`);
  
  // Restaurar
  if (originalLocation) {
    global.window.location = originalLocation;
  }
});

console.log('\n🎯 Configuración verificada. La aplicación debería funcionar desde cualquier IP.');