/**
 * Utility para gestión segura de localStorage con expiración automática
 * Protege datos sensibles implementando timeouts y limpieza automática
 */

// Configuración de expiración en milisegundos
const EXPIRATION_TIMES = {
  token: 4 * 60 * 60 * 1000,        // 4 horas para token
  userSession: 2 * 60 * 60 * 1000,  // 2 horas para datos de sesión
  sensitive: 30 * 60 * 1000,        // 30 minutos para datos sensibles (DNI, CUIL)
  temporary: 15 * 60 * 1000         // 15 minutos para datos temporales
};

// Configuración de inactividad más estricta
const INACTIVITY_CONFIG = {
  autoLogout: 40 * 60 * 1000,       // 40 minutos de inactividad → logout automático
  warningTime: 35 * 60 * 1000,      // Advertencia a los 35 minutos
  checkInterval: 60 * 1000          // Verificar cada minuto
};

// Clasificación de datos por nivel de sensibilidad
const DATA_CLASSIFICATION = {
  critical: ['token'],
  sensitive: ['userDni', 'userCuil', 'userId'],
    session: ['userNombre', 'userApellido', 'userNombreCompleto', 'userRol', 'userApodo'],
  temporary: ['userData', 'tempData']
};

class SecureStorage {
  constructor() {
    this.lastActivity = Date.now();
    this.inactivityTimeout = null;
    this.warningTimeout = null;
    this.checkInterval = null;
    this.init();
  }

  init() {
    // Verificar expiración al inicializar
    this.checkExpiration();
    
    // Configurar limpieza automática cada 5 minutos
    setInterval(() => {
      this.checkExpiration();
    }, 5 * 60 * 1000);

    // Configurar detección de inactividad
    this.setupInactivityDetection();

    // Limpiar al cerrar/refrescar página (más agresivo)
    window.addEventListener('beforeunload', (e) => {
      this.cleanupOnExit();
      // Forzar limpieza completa
      this.clearAllStorage();
    });

    // Limpiar en cambio de visibilidad (tab inactivo)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.scheduleInactivityCleanup();
      } else {
        this.cancelInactivityCleanup();
        this.updateActivity();
      }
    });

    // Detectar actividad del usuario
    this.setupActivityDetection();
  }

  /**
   * Almacenar datos con timestamp de expiración
   */
  setItem(key, value, customExpiration = null) {
    try {
      const expirationTime = customExpiration || this.getExpirationTime(key);
      const item = {
        value: value,
        timestamp: Date.now(),
        expires: Date.now() + expirationTime
      };
      
      localStorage.setItem(key, JSON.stringify(item));
      
    } catch (error) {
      console.error('Error al almacenar en localStorage:', error);
    }
  }

  /**
   * Obtener datos verificando expiración
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsedItem = JSON.parse(item);
      
      // Verificar si es formato legacy (sin timestamp)
      if (!parsedItem.timestamp) {
        // Migrar datos legacy con expiración actual
        this.setItem(key, item);
        return item;
      }

      // Verificar expiración
      if (Date.now() > parsedItem.expires) {
        console.warn(`⚠️ Datos expirados removidos: ${key}`);
        this.removeItem(key);
        return null;
      }

      return parsedItem.value;
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return null;
    }
  }

  /**
   * Remover item específico
   */
  removeItem(key) {
    localStorage.removeItem(key);
  }

  /**
   * Verificar expiración de todos los items
   */
  checkExpiration() {
    const keys = Object.keys(localStorage);
    let expiredCount = 0;

    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return;

        const parsedItem = JSON.parse(item);
        
        // Solo verificar items con timestamp
        if (parsedItem.timestamp && Date.now() > parsedItem.expires) {
          this.removeItem(key);
          expiredCount++;
        }
      } catch (error) {
        // Ignorar errores de parsing para items que no son del sistema
      }
    });

    if (expiredCount > 0) {
    }
  }

  /**
   * Obtener tiempo de expiración según el tipo de dato
   */
  getExpirationTime(key) {
    // Buscar en clasificación crítica
    if (DATA_CLASSIFICATION.critical.includes(key)) {
      return EXPIRATION_TIMES.token;
    }
    
    // Buscar en clasificación sensible
    if (DATA_CLASSIFICATION.sensitive.includes(key)) {
      return EXPIRATION_TIMES.sensitive;
    }
    
    // Buscar en clasificación de sesión
    if (DATA_CLASSIFICATION.session.includes(key)) {
      return EXPIRATION_TIMES.userSession;
    }
    
    // Buscar en clasificación temporal
    if (DATA_CLASSIFICATION.temporary.includes(key)) {
      return EXPIRATION_TIMES.temporary;
    }

    // Por defecto, usar tiempo de sesión
    return EXPIRATION_TIMES.userSession;
  }

  /**
   * Limpiar datos sensibles al salir
   */
  cleanupOnExit() {
    // Limpieza completa de localStorage y sessionStorage
    this.clearAllStorage();
  }

  /**
   * Configurar detección de actividad del usuario
   */
  setupActivityDetection() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
  }

  /**
   * Actualizar timestamp de última actividad
   */
  updateActivity() {
    this.lastActivity = Date.now();
    
    // Resetear timers de inactividad
    this.resetInactivityTimers();
  }

  /**
   * Configurar sistema de detección de inactividad
   */
  setupInactivityDetection() {
    // Verificar inactividad cada minuto
    this.checkInterval = setInterval(() => {
      this.checkInactivity();
    }, INACTIVITY_CONFIG.checkInterval);
  }

  /**
   * Verificar tiempo de inactividad
   */
  checkInactivity() {
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    
    // Si han pasado 40 minutos de inactividad → logout automático
    if (timeSinceLastActivity >= INACTIVITY_CONFIG.autoLogout) {
      console.warn('🚨 40 minutos de inactividad - Cerrando sesión automáticamente');
      this.forceLogout();
      return;
    }

    // Si han pasado 35 minutos → mostrar advertencia
    if (timeSinceLastActivity >= INACTIVITY_CONFIG.warningTime && !this.warningShown) {
      this.showInactivityWarning();
      this.warningShown = true;
    }
  }

  /**
   * Resetear timers de inactividad
   */
  resetInactivityTimers() {
    this.warningShown = false;
    
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }
  }

  /**
   * Mostrar advertencia de inactividad
   */
  showInactivityWarning() {
    const minutesRemaining = Math.ceil((INACTIVITY_CONFIG.autoLogout - (Date.now() - this.lastActivity)) / 60000);
    
    // Dispatch evento personalizado para que la UI pueda mostrar la advertencia
    window.dispatchEvent(new CustomEvent('inactivityWarning', {
      detail: { minutesRemaining }
    }));
    
    console.warn(`⚠️ Advertencia: La sesión se cerrará automáticamente en ${minutesRemaining} minutos por inactividad`);
  }

  /**
   * Forzar logout por inactividad
   */
  forceLogout() {
    // Limpiar todo el localStorage
    this.clearAllStorage();
    
    // Dispatch evento para que la aplicación redirija al login
    window.dispatchEvent(new CustomEvent('forceLogout', {
      detail: { reason: 'inactivity', message: 'Sesión cerrada por 40 minutos de inactividad' }
    }));
  }

  /**
   * Limpiar completamente todo el localStorage (más agresivo)
   */
  clearAllStorage() {
    try {
      // Limpiar todo el localStorage, no solo items de la app
      localStorage.clear();
      
      // También limpiar sessionStorage por seguridad
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Error al limpiar storage:', error);
    }
  }

  /**
   * Cancelar limpieza por inactividad
   */
  cancelInactivityCleanup() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  /**
   * Programar limpieza por inactividad cuando tab está oculto
   */
  scheduleInactivityCleanup() {
    // Cancelar timeout previo si existe
    this.cancelInactivityCleanup();
    
    // Programar limpieza después de tiempo de inactividad
    this.inactivityTimeout = setTimeout(() => {
      console.warn('🚨 Tab inactivo - Ejecutando limpieza de seguridad');
      this.clearAllStorage();
    }, INACTIVITY_CONFIG.autoLogout);
  }

  /**
   * Limpiar todos los datos de la aplicación
   */
  clearAll() {
    const appKeys = [
      ...DATA_CLASSIFICATION.critical,
      ...DATA_CLASSIFICATION.sensitive,
      ...DATA_CLASSIFICATION.session,
      ...DATA_CLASSIFICATION.temporary
    ];

    appKeys.forEach(key => {
      this.removeItem(key);
    });

  }

  /**
   * Obtener información de estado de la sesión
   */
  getSessionInfo() {
    const token = this.getItem('token');
    if (!token) return null;

    try {
      const tokenItem = JSON.parse(localStorage.getItem('token'));
      const timeRemaining = tokenItem.expires - Date.now();
      const minutesRemaining = Math.round(timeRemaining / 1000 / 60);

      return {
        isValid: timeRemaining > 0,
        minutesRemaining: Math.max(0, minutesRemaining),
        expiresAt: new Date(tokenItem.expires)
      };
    } catch {
      return null;
    }
  }

  /**
   * Extender sesión (renovar timestamps)
   */
  extendSession() {
    const sessionKeys = [
      ...DATA_CLASSIFICATION.session,
      'token'
    ];

    sessionKeys.forEach(key => {
      const value = this.getItem(key);
      if (value) {
        this.setItem(key, value); // Esto actualizará el timestamp
      }
    });

  }

  /**
   * Migrar datos legacy a formato seguro
   */
  migrateLegacyData() {
    const allKeys = [
      ...DATA_CLASSIFICATION.critical,
      ...DATA_CLASSIFICATION.sensitive,
      ...DATA_CLASSIFICATION.session,
      ...DATA_CLASSIFICATION.temporary
    ];

    let migratedCount = 0;

    allKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          // Verificar si ya tiene formato con timestamp
          const parsed = JSON.parse(item);
          if (!parsed.timestamp) {
            // Es formato legacy, migrar
            this.setItem(key, item);
            migratedCount++;
          }
        } catch {
          // Es string simple, migrar
          this.setItem(key, item);
          migratedCount++;
        }
      }
    });

    if (migratedCount > 0) {
    }
  }
}

// Crear instancia global
const secureStorage = new SecureStorage();

// Migrar datos existentes al cargar
secureStorage.migrateLegacyData();

export default secureStorage;
