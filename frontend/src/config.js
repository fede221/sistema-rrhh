// Configuración centralizada de la URL base de la API para frontend
const getApiBaseUrl = () => {
  // En desarrollo, detectar automáticamente la configuración
  if (process.env.NODE_ENV !== 'production') {
    const hostname = window.location.hostname;
    
    // Si accedemos desde localhost/127.0.0.1, primero intentar con localhost
    // y si no funciona, usar la IP de red local detectada
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Prioridad: localhost primero, luego IP de red
      const possibleHosts = [
        'localhost',
        '192.168.203.24',        '127.0.0.1'
      ];
      
      // En este caso, como sabemos que el backend está en localhost,
      // usamos localhost para evitar problemas de conectividad
      return 'http://localhost:3001';
    } else {
      // Si accedemos desde otra IP, usar la misma IP para el backend
      return `http://${hostname}:3001`;
    }
  }
  
  // En producción, usar ruta vacía (nginx agrega /api)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
export { getApiBaseUrl };
