/**
 * 🛡️ Validación de contraseñas seguras
 * Implementa requisitos de complejidad para prevenir contraseñas débiles
 */

/**
 * Valida que una contraseña cumpla con los requisitos mínimos de seguridad
 * @param {string} password - La contraseña a validar
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
  const errors = [];

  // Convertir a string y trim
  const pwd = String(password || '').trim();

  // Requisito 1: Longitud mínima 8 caracteres
  if (pwd.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  // Requisito 2: Al menos una letra minúscula
  if (!/[a-z]/.test(pwd)) {
    errors.push('La contraseña debe contener al menos una letra minúscula (a-z)');
  }

  // Requisito 3: Al menos una letra mayúscula
  if (!/[A-Z]/.test(pwd)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula (A-Z)');
  }

  // Requisito 4: Al menos un número
  if (!/[0-9]/.test(pwd)) {
    errors.push('La contraseña debe contener al menos un número (0-9)');
  }

  // Requisito 5: No debe contener espacios
  if (/\s/.test(pwd)) {
    errors.push('La contraseña no puede contener espacios');
  }

  // Requisito 6 (opcional): Al menos un carácter especial
  // Descomentado por ahora para no ser demasiado estricto
  // if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
  //   errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)');
  // }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Valida una contraseña y lanza un error si no es válida
 * @param {string} password - La contraseña a validar
 * @throws {Error} Si la contraseña no cumple los requisitos
 */
function validatePasswordOrThrow(password) {
  const result = validatePassword(password);
  if (!result.valid) {
    const error = new Error(result.errors.join('. '));
    error.statusCode = 400;
    error.errors = result.errors;
    throw error;
  }
}

/**
 * Obtiene un mensaje de ayuda con los requisitos de contraseña
 * @returns {string} Mensaje con los requisitos
 */
function getPasswordRequirements() {
  return 'La contraseña debe tener: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número. No puede contener espacios.';
}

module.exports = {
  validatePassword,
  validatePasswordOrThrow,
  getPasswordRequirements
};
