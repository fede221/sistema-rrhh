// src/utils/auth.js
import secureStorage from './secureStorage';

export const getToken = () => secureStorage.getItem('token');

export const getUser = () => {
  const nombre = secureStorage.getItem('userNombre');
  const apellido = secureStorage.getItem('userApellido');
  const apodo = secureStorage.getItem('userApodo');
  const rol = secureStorage.getItem('userRol');
  const id = secureStorage.getItem('userId');

  // Si no hay datos básicos, no hay sesión
  if (!nombre && !apellido && !rol) return null;

  const nombreCompleto = `${nombre || ''} ${apellido || ''}`.trim();

  // displayName: si existe apodo, usarlo; sino usar nombreCompleto; si ninguno, usar rol o 'Usuario'
  const displayName = apodo || nombreCompleto || rol || 'Usuario';

  return {
    nombre,
    apellido,
    apodo,
    nombreCompleto,
    displayName,
    rol,
    id,
  };
};

export const clearAuthData = () => {
  secureStorage.clearAll();
};

export const getSessionInfo = () => secureStorage.getSessionInfo();

export const extendSession = () => secureStorage.extendSession();