/**
 * Construye una URL absoluta a partir de una ruta relativa
 * @param {string} relativePath - Ruta relativa (ej: '/uploads/imagen.png')
 * @returns {string|null} - URL completa o null si no hay ruta
 */
const buildAbsoluteUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // Si ya es una URL absoluta, retornar tal como está
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Construir URL completa usando la configuración del servidor
  const protocol = 'http://';
  const host = 'localhost'; // Usar localhost para evitar problemas de conectividad
  const port = process.env.PORT || 3001;
  
  // Asegurar que la ruta empiece con /
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${protocol}${host}:${port}${path}`;
};

module.exports = {
  buildAbsoluteUrl
};