/**
 * 🔐 Generador de contraseñas seguras automáticas
 * Genera contraseñas que cumplen con los requisitos de seguridad
 */

/**
 * Genera una contraseña segura aleatoria que cumple con los requisitos
 * Requisitos: 8+ caracteres, mayúscula, minúscula, número, sin espacios
 * 
 * @param {number} length - Longitud deseada (default: 12)
 * @returns {string} Contraseña segura
 */
function generateSecurePassword(length = 12) {
  // Asegurar que la longitud sea al menos 8
  const finalLength = Math.max(length, 8);

  // Definir caracteres para cada categoría
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*'; // Símbolos seguros (sin caracteres problemáticos)

  // Crear arreglo con al menos 1 de cada tipo requerido
  let password = [];

  // Agregar 1 mayúscula
  password.push(uppercase[Math.floor(Math.random() * uppercase.length)]);

  // Agregar 1 minúscula
  password.push(lowercase[Math.floor(Math.random() * lowercase.length)]);

  // Agregar 1 número
  password.push(numbers[Math.floor(Math.random() * numbers.length)]);

  // Agregar 1 símbolo
  password.push(symbols[Math.floor(Math.random() * symbols.length)]);

  // Llenar el resto con caracteres aleatorios de todas las categorías
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < finalLength; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Mezclar la contraseña (Fisher-Yates shuffle)
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}

/**
 * Genera una contraseña simple pero segura basada en el DNI
 * Útil para carga masiva: Usa partes del DNI + datos del usuario
 * Formato: Dni+ apellido + número aleatorio
 * Ejemplo: 39266Sanza1!Paye
 * 
 * @param {string} dni - DNI del usuario
 * @param {string} apellido - Apellido del usuario
 * @returns {string} Contraseña generada
 */
function generatePasswordFromUserData(dni, apellido) {
  const dniPart = String(dni).slice(-4); // Últimos 4 dígitos del DNI
  const apellidoPart = String(apellido).slice(0, 5).toUpperCase(); // Primeros 5 caracteres del apellido
  const randomNum = Math.floor(Math.random() * 900) + 100; // Número entre 100 y 999
  const randomChar = ['!', '@', '#', '$', '%'][Math.floor(Math.random() * 5)]; // Símbolo aleatorio

  return `${dniPart}${apellidoPart}${randomNum}${randomChar}`;
}

/**
 * Verifica si una contraseña es un marcador que necesita ser generada
 * Marcadores reconocidos: [PRESENTE], PRESENTE, auto, AUTO, generate
 * 
 * @param {string} password - Valor de contraseña a verificar
 * @returns {boolean} True si es un marcador que necesita generación
 */
function isPasswordMarker(password) {
  const pwd = String(password || '').trim().toUpperCase();
  const markers = ['[PRESENTE]', 'PRESENTE', 'AUTO', 'GENERATE', '[AUTO]', '[GENERATE]'];
  return markers.includes(pwd);
}

/**
 * Procesa la contraseña: si es un marcador, la genera automáticamente
 * Contraseña por defecto: Royal123!
 * 
 * @param {string} password - Valor original de contraseña
 * @param {string} dni - DNI del usuario (opcional, para generar basada en datos)
 * @param {string} apellido - Apellido del usuario (opcional)
 * @returns {Object} { password: string generada, wasGenerated: boolean }
 */
function processPassword(password, dni = null, apellido = null) {
  if (isPasswordMarker(password)) {
    // Usar Royal123! como contraseña por defecto
    return {
      password: 'Royal123!',
      wasGenerated: true,
      method: 'default'
    };
  }

  // Si no es un marcador, devolver la contraseña tal como es
  return {
    password: String(password || '').trim(),
    wasGenerated: false,
    method: 'provided'
  };
}

module.exports = {
  generateSecurePassword,
  generatePasswordFromUserData,
  isPasswordMarker,
  processPassword
};
