import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Box,
  IconButton
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getSessionInfo, extendSession, clearAuthData } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const SessionManager = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showCritical, setShowCritical] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = () => {
      const info = getSessionInfo();
      setSessionInfo(info);

      if (!info || !info.isValid) {
        // Sesión expirada, redirigir al login
        clearAuthData();
        navigate('/login');
        return;
      }

      // Mostrar advertencia cuando quedan 15 minutos o menos
      if (info.minutesRemaining <= 15 && info.minutesRemaining > 5) {
        setShowWarning(true);
        setShowCritical(false);
      }
      // Mostrar alerta crítica cuando quedan 5 minutos o menos
      else if (info.minutesRemaining <= 5) {
        setShowWarning(false);
        setShowCritical(true);
      }
      // Ocultar alertas si hay más de 15 minutos
      else {
        setShowWarning(false);
        setShowCritical(false);
      }
    };

    // Verificar sesión inmediatamente
    checkSession();

    // Verificar cada minuto
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleExtendSession = () => {
    try {
      extendSession();
      setShowWarning(false);
      setShowCritical(false);
      
      // Mostrar confirmación
      setTimeout(() => {
        setSessionInfo(getSessionInfo());
      }, 100);
    } catch (error) {
      console.error('Error al extender sesión:', error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const handleDismissWarning = () => {
    setShowWarning(false);
  };

  if (!sessionInfo) return null;

  return (
    <>
      {/* Diálogo de advertencia (15 minutos) */}
      <Dialog
        open={showWarning}
        onClose={handleDismissWarning}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          Advertencia de Sesión
          <IconButton
            onClick={handleDismissWarning}
            sx={{ ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Su sesión expirará en <strong>{sessionInfo.minutesRemaining} minutos</strong>
          </Alert>
          <Typography variant="body2">
            Por seguridad, las sesiones tienen un tiempo límite. 
            Puede extender su sesión o guardar su trabajo antes de que expire.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Expira: {sessionInfo.expiresAt.toLocaleString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDismissWarning}>
            Entendido
          </Button>
          <Button 
            onClick={handleExtendSession}
            variant="contained"
            startIcon={<RefreshIcon />}
          >
            Extender Sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo crítico (5 minutos) */}
      <Dialog
        open={showCritical}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          ¡Sesión Por Expirar!
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Su sesión expirará en <strong>{sessionInfo.minutesRemaining} minutos</strong>
          </Alert>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Tiempo restante:
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(sessionInfo.minutesRemaining / 5) * 100}
              color="error"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Typography variant="body2" color="error">
            <strong>¡Acción requerida!</strong> Su trabajo no guardado se perderá.
            Extienda su sesión ahora o cierre sesión de forma segura.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogout} color="error">
            Cerrar Sesión
          </Button>
          <Button 
            onClick={handleExtendSession}
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            autoFocus
          >
            Extender Sesión Ahora
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionManager;