// Script para desregistrar Service Workers existentes - SOLO EN DESARROLLO
(function() {
  // Detectar si estamos en un entorno de desarrollo local
  const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Solo ejecutar en desarrollo local, no en Docker o producción
  if (!isLocalDevelopment) {
    console.log('ℹ️ Script de limpieza SW: Saltando en entorno de producción/Docker');
    return;
  }
  
  // Verificar si ya ejecutamos la limpieza anteriormente
  const CLEANUP_KEY = 'sw-cleanup-completed';
  const cleanupCompleted = localStorage.getItem(CLEANUP_KEY);
  
  if (cleanupCompleted === 'true') {
    console.log('✅ Limpieza de Service Workers ya completada previamente');
    return; // Salir sin hacer nada
  }
  
  console.log('🔧 Iniciando limpieza de Service Workers...');
  let needsReload = false;
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      console.log('📋 Service Workers encontrados:', registrations.length);
      
      if (registrations.length > 0) {
        needsReload = true;
        for(let registration of registrations) {
          console.log('🗑️ Desregistrando Service Worker:', registration.scope);
          registration.unregister().then(function(boolean) {
            console.log('✅ Service Worker desregistrado:', boolean);
          }).catch(function(error) {
            console.log('❌ Error al desregistrar SW:', error);
          });
        }
      }
      
      // Limpiar caches después de un momento
      setTimeout(function() {
        limpiarCaches(needsReload);
      }, 500);
      
    }).catch(function(error) {
      console.log('❌ Error al obtener registros SW:', error);
      limpiarCaches(false);
    });
  } else {
    console.log('ℹ️ Service Workers no soportados');
    limpiarCaches(false);
  }
  
  function limpiarCaches(shouldReload) {
    if ('caches' in window) {
      console.log('🧹 Verificando caches...');
      caches.keys().then(function(cacheNames) {
        console.log('📋 Caches encontrados:', cacheNames.length);
        
        if (cacheNames.length > 0) {
          shouldReload = true;
          return Promise.all(
            cacheNames.map(function(cacheName) {
              console.log('🗑️ Eliminando cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        }
        
        return Promise.resolve();
      }).then(function() {
        // Marcar limpieza como completada
        localStorage.setItem(CLEANUP_KEY, 'true');
        console.log('✅ Limpieza completada');
        
        if (shouldReload) {
          console.log('🔄 Recargando página una vez para aplicar cambios...');
          setTimeout(function() {
            window.location.reload(true);
          }, 1000);
        } else {
          console.log('ℹ️ No es necesario recargar - no había SW ni caches');
        }
      }).catch(function(error) {
        console.log('❌ Error al limpiar caches:', error);
        localStorage.setItem(CLEANUP_KEY, 'true'); // Marcar como completado aunque haya error
      });
    } else {
      console.log('ℹ️ Cache API no soportada');
      localStorage.setItem(CLEANUP_KEY, 'true');
    }
  }
})();