import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert, IconButton } from '@mui/material';
import { Close as CloseIcon, GetApp as InstallIcon } from '@mui/icons-material';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es móvil
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 && 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    // Detectar si ya está instalada como PWA
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    checkMobile();
    checkStandalone();

    // Solo en móviles mostrar el prompt de instalación
    if (isMobile && !isStandalone) {
      // Escuchar el evento beforeinstallprompt
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Mostrar después de 10 segundos de uso
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 10000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, [isMobile, isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalada');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
  };

  // No mostrar si no es móvil, ya está instalada, o no hay prompt
  if (!isMobile || isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <Snackbar
      open={showInstallPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={null}
    >
      <Alert
        severity="info"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              color="inherit"
              size="small"
              onClick={handleInstallClick}
              startIcon={<InstallIcon />}
            >
              Instalar
            </Button>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        }
        sx={{ 
          width: '100%',
          '& .MuiAlert-message': {
            fontSize: '0.875rem'
          }
        }}
      >
        ¡Instala la app para una mejor experiencia!
      </Alert>
    </Snackbar>
  );
};

export default InstallPWA;