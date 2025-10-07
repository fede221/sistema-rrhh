import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

const MobileAppWrapper = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es móvil
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 && 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      return mobile;
    };

    const mobile = checkMobile();

    // Si es móvil, aplicar configuración agresiva
    if (mobile) {
      document.body.classList.add('mobile-app-mode');
      
      // Configurar viewport para pantalla completa
      let viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, minimal-ui'
        );
      }

      // Configuración específica para iOS
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Aplicar estilos específicos para iOS Safari
        document.documentElement.style.setProperty('height', '100%', 'important');
        document.body.style.setProperty('height', '100%', 'important');
        document.body.style.setProperty('position', 'fixed', 'important');
        document.body.style.setProperty('width', '100%', 'important');
        document.body.style.setProperty('top', '0', 'important');
        document.body.style.setProperty('left', '0', 'important');
      }

      // Configuración específica para Android
      if (/Android/i.test(navigator.userAgent)) {
        // Calcular viewport height real
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Aplicar altura dinámica
        document.body.style.setProperty('height', 'calc(var(--vh, 1vh) * 100)', 'important');
        
        // Actualizar en resize
        const updateVH = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        window.addEventListener('resize', updateVH);
        window.addEventListener('orientationchange', updateVH);
        
        return () => {
          window.removeEventListener('resize', updateVH);
          window.removeEventListener('orientationchange', updateVH);
        };
      }

      // Función para ocultar barra de dirección
      const hideAddressBar = () => {
        // Múltiples intentos con diferentes métodos
        setTimeout(() => window.scrollTo(0, 1), 0);
        setTimeout(() => window.scrollTo(0, 1), 100);
        setTimeout(() => window.scrollTo(0, 1), 500);
        
        // Método adicional para Chrome móvil
        if (window.chrome) {
          setTimeout(() => {
            document.body.style.height = '101vh';
            setTimeout(() => {
              document.body.style.height = '100vh';
            }, 50);
          }, 100);
        }
      };

      hideAddressBar();
      window.addEventListener('load', hideAddressBar);
      window.addEventListener('resize', hideAddressBar);
      window.addEventListener('orientationchange', () => {
        setTimeout(hideAddressBar, 500);
      });

      return () => {
        document.body.classList.remove('mobile-app-mode');
      };
    }
  }, []);

  // Estilos agresivos para móviles
  const mobileStyles = isMobile ? {
    height: '100vh',
    height: '100dvh', // Dynamic viewport height
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    overflow: 'hidden',
    // Safe area insets
    paddingTop: 'max(0px, env(safe-area-inset-top))',
    paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
    paddingLeft: 'max(0px, env(safe-area-inset-left))',
    paddingRight: 'max(0px, env(safe-area-inset-right))',
    boxSizing: 'border-box'
  } : {
    width: '100%',
    minHeight: '100vh'
  };

  return (
    <Box sx={mobileStyles}>
      <Box sx={{
        height: '100%',
        width: '100%',
        overflow: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default MobileAppWrapper;