// src/pages/Login/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Snackbar, 
  Alert, 
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import secureStorage from '../../utils/secureStorage';
import { apiRequest } from '../../utils/api';
import Version from '../../components/Version';

const Login = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validaciones básicas
  if (!dni.trim()) {
    setSnackbar({ open: true, message: '⚠️ Por favor ingresa tu DNI', severity: 'warning' });
    return;
  }
  
  if (!password.trim()) {
    setSnackbar({ open: true, message: '⚠️ Por favor ingresa tu contraseña', severity: 'warning' });
    return;
  }

  setLoading(true);

  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ dni, password })
    });

    // ✅ Guardar datos del usuario con expiración automática
    secureStorage.setItem('token', data.token);
    secureStorage.setItem('userNombre', data.nombre);
    secureStorage.setItem('userApellido', data.apellido);
  // Guardar apodo si el backend lo devuelve (campo opcional 'apodo' o 'nickname')
  if (data.apodo) secureStorage.setItem('userApodo', data.apodo);
  if (data.nickname) secureStorage.setItem('userApodo', data.nickname);
    secureStorage.setItem('userNombreCompleto', `${data.nombre} ${data.apellido}`);
    secureStorage.setItem('userRol', data.rol);
    secureStorage.setItem('userId', data.id);
    secureStorage.setItem('userCuil', data.cuil || '');
    secureStorage.setItem('userDni', data.dni || '');

    // Mostrar apodo en la bienvenida si existe
    const welcomeName = data.apodo || data.nickname || data.nombre;
    setSnackbar({ 
      open: true, 
      message: `🎉 ¡Bienvenido/a ${welcomeName}! Iniciando sesión...`, 
      severity: 'success' 
    });

    // 🔍 Verificar si ya cargó las preguntas
    const verificarData = await apiRequest(`/api/preguntas/verificar-preguntas/${data.id}`);

    setTimeout(() => {
      if (!verificarData.tienePreguntas) {
        navigate('/preguntas-iniciales'); // Página donde carga las preguntas
      } else {
        // Dirigir según el rol del usuario
        if (data.rol === 'empleado') {
          navigate('/bienvenida'); // Vista de bienvenida para empleados
        } else {
          navigate('/dashboard'); // Vista principal para admins, superadmin, etc.
        }
      }
    }, 1500);
    
  } catch (err) {
    console.error('❌ Error al iniciar sesión:', err);
    
    // Mensajes de error más específicos
    let errorMessage = '❌ Error al iniciar sesión';
    
    if (err.message && err.message.includes('401')) {
      errorMessage = '🔐 DNI o contraseña incorrectos. Verifica tus datos.';
    } else if (err.message && err.message.includes('404')) {
      errorMessage = '👤 Usuario no encontrado. Verifica tu DNI.';
    } else if (err.message && err.message.includes('403')) {
      errorMessage = '🚫 Acceso denegado. Contacta al administrador.';
    } else if (err.message && err.message.includes('500')) {
      errorMessage = '⚠️ Error del servidor. Intenta nuevamente.';
    } else if (err.message && (err.message.includes('network') || err.message.includes('fetch'))) {
      errorMessage = '🌐 Error de conexión. Verifica tu internet.';
    }
    
    setSnackbar({ open: true, message: errorMessage, severity: 'error' });
  } finally {
    setLoading(false);
  }
};


  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2
        }}
      >
        <Paper 
          elevation={isMobile ? 0 : 3}
          sx={{ 
            p: isMobile ? 2 : 4, 
            width: '100%',
            maxWidth: 400,
            borderRadius: isMobile ? 0 : 2
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: '#1976d2',
                mb: 1
              }}
            >
              Sistema RRHH
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Iniciar Sesión
            </Typography>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <TextField 
              label="DNI" 
              value={dni} 
              onChange={(e) => setDni(e.target.value)} 
              fullWidth 
              margin="normal" 
              required 
              size={isMobile ? "small" : "medium"}
              variant="outlined"
            />
            <TextField 
              label="Contraseña" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              fullWidth 
              margin="normal" 
              required 
              size={isMobile ? "small" : "medium"}
              variant="outlined"
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              disabled={loading}
              size={isMobile ? "medium" : "large"}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: isMobile ? 1.5 : 2,
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Iniciando sesión...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                <Button 
                  onClick={() => navigate('/reset-password')} 
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    color: '#1976d2',
                    textTransform: 'none',
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>

                <Button
                  onClick={() => navigate('/reset-password')}
                  size={isMobile ? "small" : "medium"}
                  variant="outlined"
                  sx={{
                    color: '#1976d2',
                    textTransform: 'none',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    borderColor: '#1976d2'
                  }}
                >
                  Cambiar contraseña
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>

      {/* Notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            fontSize: isMobile ? '0.875rem' : '1rem',
            '& .MuiAlert-icon': {
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Componente de versión en la esquina inferior derecha */}
      <Version />
    </Container>
  );
};

export default Login;
