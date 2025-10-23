import { API_BASE_URL } from '../../config';
// src/pages/Login/ResetPassword.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button,
  Snackbar, Alert, Modal, List, ListItem, ListItemIcon, ListItemText, Popper, Paper, ClickAwayListener
} from '@mui/material';
import { CheckCircleOutline, Cancel as CancelIcon } from '@mui/icons-material';
import axios from 'axios';



const ResetPassword = () => {
  const [dni, setDni] = useState('');
  const [etapa, setEtapa] = useState('inicio'); // inicio, verificar
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({ length: false, upper: false, lower: false, number: false, nospace: true });
  const passwordAnchorRef = useRef(null);
  const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);
  const navigate = useNavigate();

  const evaluatePassword = (pw) => {
    const pwd = String(pw || '');
    const length = pwd.length >= 8;
    const upper = /[A-Z]/.test(pwd);
    const lower = /[a-z]/.test(pwd);
    const number = /[0-9]/.test(pwd);
    const nospace = !/\s/.test(pwd);
    return { length, upper, lower, number, nospace };
  };

const handleVerificarPreguntas = async () => {
  if (!dni) {
    setSnackbar({ open: true, message: 'Por favor ingresa tu DNI', severity: 'warning' });
    return;
  }

  try {
    // Usar la nueva ruta unificada del backend
  const response = await axios.get(`${API_BASE_URL}/api/auth/recovery-questions/${dni}`);
    
    setUserId(response.data.userId);
    setPreguntas(response.data.preguntas || []);
    setEtapa('verificar');
    
  } catch (err) {
    console.error('Error al obtener preguntas:', err);
    
    if (err.response?.status === 404) {
      if (err.response.data.error === 'Usuario no encontrado') {
        setSnackbar({ open: true, message: 'DNI no encontrado en el sistema', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'No tienes preguntas de seguridad configuradas. Contacta al administrador.', severity: 'error' });
      }
    } else {
      setSnackbar({ open: true, message: 'Error al verificar preguntas', severity: 'error' });
    }
  }
};

const handleVerificarRespuestas = async () => {
  // Validar que todas las preguntas estén respondidas
  const preguntasRespondidas = preguntas.filter(p => {
    const respuesta = respuestas[p.id];
    return respuesta && respuesta.trim() !== '';
  });

  if (preguntasRespondidas.length !== preguntas.length) {
    setSnackbar({ open: true, message: 'Por favor responde todas las preguntas', severity: 'warning' });
    return;
  }

  try {
    const respuestasArray = preguntas.map(p => ({
      pregunta_id: p.id,
      respuesta: respuestas[p.id].trim(),
    }));

    // Usar la nueva ruta de validación
  const response = await axios.post(`${API_BASE_URL}/api/auth/validate-recovery`, {
      userId,
      respuestas: respuestasArray
    });

    if (response.data.success) {
      setMostrarModalPassword(true);
    } else {
      setSnackbar({ open: true, message: 'Respuestas incorrectas', severity: 'error' });
    }
  } catch (err) {
    console.error('Error al verificar respuestas:', err);
    setSnackbar({
      open: true,
      message: err.response?.data?.error || 'Error al verificar respuestas',
      severity: 'error'
    });
  }
};


const handleCambiarPassword = async () => {
  if (!nuevaPassword || nuevaPassword.trim() === '') {
    setSnackbar({ open: true, message: 'Por favor ingresa una contraseña', severity: 'warning' });
    return;
  }

  // Validar contra reglas del servidor
  const checks = evaluatePassword(nuevaPassword);
  setPasswordChecks(checks);
  if (!checks.length || !checks.upper || !checks.lower || !checks.number || !checks.nospace) {
    // Construir mensaje con detalles
    const detalles = [];
    if (!checks.length) detalles.push('mínimo 8 caracteres');
    if (!checks.upper) detalles.push('una letra mayúscula');
    if (!checks.lower) detalles.push('una letra minúscula');
    if (!checks.number) detalles.push('un número');
    if (!checks.nospace) detalles.push('sin espacios');
    setSnackbar({ open: true, message: `La contraseña debe contener: ${detalles.join(', ')}`, severity: 'warning' });
    return;
  }

  if (nuevaPassword !== confirmarPassword) {
    setSnackbar({ open: true, message: 'Las contraseñas no coinciden', severity: 'warning' });
    return;
  }

  try {
    // Usar la ruta de auth para cambiar contraseña
  await axios.post(`${API_BASE_URL}/api/auth/reset-password/${userId}`, {
      nuevaPassword: nuevaPassword.trim(),
    });

    setMostrarModalPassword(false);
    setSnackbar({ 
      open: true, 
      message: '✅ Contraseña cambiada con éxito. Redirigiendo al login...', 
      severity: 'success' 
    });

    // Limpiar formulario
    setEtapa('inicio');
    setDni('');
    setRespuestas({});
    setNuevaPassword('');
    setConfirmarPassword('');
    setPreguntas([]);
    setUserId(null);

    // Esperar 2 segundos y redirigir
    setTimeout(() => {
      navigate('/login');
    }, 2000);

  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    setSnackbar({ 
      open: true, 
      message: err.response?.data?.error || '❌ Error al cambiar contraseña', 
      severity: 'error' 
    });
  }
};



  return (
    <Box sx={{ mt: 10, mx: 'auto', maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>Recuperar Contraseña</Typography>

      {etapa === 'inicio' && (
        <>
          <TextField label="DNI" fullWidth margin="normal" value={dni} onChange={(e) => setDni(e.target.value)} />
          <Button variant="contained" onClick={handleVerificarPreguntas}>Continuar</Button>
        </>
      )}

      {etapa === 'verificar' && (
        <>
          <Typography sx={{ my: 2 }}>Respondé las siguientes preguntas para recuperar tu contraseña:</Typography>
       {preguntas.map((p, index) => (
  <TextField
   key={`${p.id || p.pregunta_id || index}-${index}`}
    label={p.pregunta}
    fullWidth
    margin="dense"
    value={respuestas[p.id || p.pregunta_id] || ''}
    onChange={(e) => setRespuestas({
      ...respuestas,
      [p.id || p.pregunta_id]: e.target.value
    })}
  />
))}
         
          <Button variant="contained" onClick={handleVerificarRespuestas} sx={{ mr: 2 }}>
            Cambiar contraseña
          </Button>
          <Button variant="outlined" onClick={() => {
            setEtapa('inicio');
            setDni('');
            setPreguntas([]);
            setRespuestas({});
            setUserId(null);
          }}>
            Volver
          </Button>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      <Modal open={mostrarModalPassword} onClose={() => setMostrarModalPassword(false)}>
        <Box sx={{ p: 4, backgroundColor: 'white', borderRadius: 2, width: 400, mx: 'auto', mt: '15%' }}>
          <Typography variant="h6" gutterBottom>Cambiar Contraseña</Typography>
          <TextField
            label="Nueva Contraseña"
            type="password"
            fullWidth
            inputRef={passwordAnchorRef}
            value={nuevaPassword}
            onFocus={() => setShowPasswordChecklist(true)}
            onChange={(e) => {
              const v = e.target.value || '';
              setNuevaPassword(v);
              setPasswordChecks(evaluatePassword ? evaluatePassword(v) : { length: v.length >= 8, upper: /[A-Z]/.test(v), lower: /[a-z]/.test(v), number: /[0-9]/.test(v), nospace: !/\s/.test(v) });
            }}
            sx={{ mb: 2 }}
            helperText="Mínimo 8 caracteres, mayúscula, minúscula y número"
          />

          <ClickAwayListener onClickAway={(event) => {
            // Ignore clicks that originate from the password input itself
            if (passwordAnchorRef.current && event && event.target && passwordAnchorRef.current.contains(event.target)) return;
            setShowPasswordChecklist(false);
          }} mouseEvent="onMouseDown" touchEvent="onTouchStart">
            <Popper open={showPasswordChecklist} anchorEl={passwordAnchorRef.current} placement="right-start" style={{ zIndex: 1300 }} disablePortal>
              <Paper elevation={3} sx={{ p: 2, width: 300 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Requisitos de contraseña</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>{passwordChecks.length ? <CheckCircleOutline sx={{ color: 'success.main' }} /> : <CancelIcon sx={{ color: 'text.disabled' }} />}</ListItemIcon>
                    <ListItemText primary="Mínimo 8 caracteres" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>{passwordChecks.upper ? <CheckCircleOutline sx={{ color: 'success.main' }} /> : <CancelIcon sx={{ color: 'text.disabled' }} />}</ListItemIcon>
                    <ListItemText primary="Al menos una letra mayúscula" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>{passwordChecks.lower ? <CheckCircleOutline sx={{ color: 'success.main' }} /> : <CancelIcon sx={{ color: 'text.disabled' }} />}</ListItemIcon>
                    <ListItemText primary="Al menos una letra minúscula" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>{passwordChecks.number ? <CheckCircleOutline sx={{ color: 'success.main' }} /> : <CancelIcon sx={{ color: 'text.disabled' }} />}</ListItemIcon>
                    <ListItemText primary="Al menos un número" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>{passwordChecks.nospace ? <CheckCircleOutline sx={{ color: 'success.main' }} /> : <CancelIcon sx={{ color: 'text.disabled' }} />}</ListItemIcon>
                    <ListItemText primary="No puede contener espacios" />
                  </ListItem>
                </List>
              </Paper>
            </Popper>
          </ClickAwayListener>
          <TextField
            label="Confirmar Contraseña"
            type="password"
            fullWidth
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" fullWidth onClick={handleCambiarPassword}>
            Guardar Contraseña
          </Button>
        </Box>
      </Modal>
    </Box>
    
  );
};

export default ResetPassword;
