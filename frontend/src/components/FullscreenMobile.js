import { useEffect } from 'react';

const FullscreenMobile = () => {
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth <= 768;
    
    if (isMobile) {
      // Intentar activar pantalla completa
      const requestFullscreen = () => {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(() => {
            console.log('Fullscreen not supported or denied');
          });
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen().catch(() => {
            console.log('WebKit fullscreen not supported');
          });
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen().catch(() => {
            console.log('Mozilla fullscreen not supported');
          });
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen().catch(() => {
            console.log('MS fullscreen not supported');
          });
        }
      };

      // Intentar al hacer click o touch
      const triggerFullscreen = () => {
        requestFullscreen();
        // Solo intentar una vez
        document.removeEventListener('touchstart', triggerFullscreen);
        document.removeEventListener('click', triggerFullscreen);
      };

      // Esperar interacción del usuario para activar fullscreen
      document.addEventListener('touchstart', triggerFullscreen, { once: true });
      document.addEventListener('click', triggerFullscreen, { once: true });

      // Cleanup
      return () => {
        document.removeEventListener('touchstart', triggerFullscreen);
        document.removeEventListener('click', triggerFullscreen);
      };
    }
  }, []);

  return null; // Este componente no renderiza nada
};

export default FullscreenMobile;