// Configuración de la URL base del API
import secureStorage from './secureStorage';

const getApiBaseUrl = () => {
  // Si estamos en producción, usar la URL relativa vacía (nginx agrega /api)
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  
  // En desarrollo, detectar si estamos accediendo desde otra máquina
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Acceso local - usar localhost
    return 'http://localhost:3001';
  } else {
    // Acceso desde otra máquina - usar la misma IP del frontend
    return `http://${hostname}:3001`;
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Función helper para hacer peticiones
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // ⚠️ COMPATIBILIDAD: Leer token de localStorage para migración gradual
  // El backend ahora usa cookies HttpOnly (más seguro), pero mantiene soporte para headers
  const token = secureStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    credentials: 'include' // 🔐 Enviar cookies HttpOnly con cada request
  });

  // Si se solicita la respuesta raw (para descargas de archivos)
  if (options.returnRaw) {
    return response;
  }

  // Si la respuesta no es exitosa, lanza un error
  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`HTTP ${response.status}: ${errorText}`);
    error.status = response.status;
    throw error;
  }

  // Si se espera una respuesta blob (para descargas)
  if (options.returnBlob) {
    return response.blob();
  }

  // Para respuestas JSON vacías o respuestas que no son JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  // Para otros tipos de respuesta
  return response.text();
};