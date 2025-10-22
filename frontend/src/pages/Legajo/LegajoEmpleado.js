import { API_BASE_URL } from '../../config';
// src/pages/LegajoEmpleado.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Typography, Box, Paper, Grid, Avatar, Divider, Button, TextField,
  Alert, Snackbar, CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { getToken } from '../../utils/auth';

const LegajoEmpleado = () => {
  const [legajo, setLegajo] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEditables, setDatosEditables] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/legajos/mi-legajo`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    .then(res => {
      setLegajo(res.data);
      // Inicializar datos editables
      setDatosEditables({
        domicilio: res.data.domicilio || '',
        localidad: res.data.localidad || '',
        codigo_postal: res.data.codigo_postal || '',
        provincia: res.data.provincia || '',
        telefono_contacto: res.data.telefono_contacto || '',
        contacto_emergencia: res.data.contacto_emergencia || '',
        email_personal: res.data.email_personal || '',
        estado_civil: res.data.estado_civil || '',
        cuenta_bancaria: res.data.cuenta_bancaria || '',
        banco_destino: res.data.banco_destino || ''
      });
    })
    .catch(err => {
      console.error(err);
      setSnackbar({ open: true, message: 'Error al cargar datos del legajo', severity: 'error' });
    });
  }, []);

  // Helper para formatear fechas
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    if (typeof fecha === 'string' && fecha.includes('T')) {
      const [y, m, d] = fecha.split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    }
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, m, d] = fecha.split('-');
      return `${d}/${m}/${y}`;
    }
    if (typeof fecha === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      return fecha;
    }
    return fecha;
  };

  // Normalizador de texto
  const normalizar = (txt) => {
    if (!txt || typeof txt !== 'string') return txt;
    return txt.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^(\w)(.*)/, (m, p1, p2) => p1.toUpperCase() + p2);
  };

  const handleEditarClick = () => {
    setModoEdicion(true);
  };

  const handleCancelarClick = () => {
    // Restaurar datos originales
    setDatosEditables({
      domicilio: legajo.domicilio || '',
      localidad: legajo.localidad || '',
      codigo_postal: legajo.codigo_postal || '',
      provincia: legajo.provincia || '',
      telefono_contacto: legajo.telefono_contacto || '',
      contacto_emergencia: legajo.contacto_emergencia || '',
      email_personal: legajo.email_personal || '',
      estado_civil: legajo.estado_civil || '',
      cuenta_bancaria: legajo.cuenta_bancaria || '',
      banco_destino: legajo.banco_destino || ''
    });
    setModoEdicion(false);
  };

  const handleGuardarClick = async () => {
    setGuardando(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/legajos/mi-legajo/datos-personales`,
        datosEditables,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      // Actualizar el estado del legajo con los nuevos datos
      setLegajo({ ...legajo, ...datosEditables });
      setModoEdicion(false);
      setSnackbar({
        open: true,
        message: 'Datos personales actualizados exitosamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al guardar:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al actualizar datos',
        severity: 'error'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleInputChange = (campo, valor) => {
    setDatosEditables(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (!legajo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Datos de identificación (NO editables)
  const datosIdentificacion = [
    { key: 'nombre', label: 'Nombre', format: normalizar },
    { key: 'apellido', label: 'Apellido', format: normalizar },
    { key: 'nro_documento', label: 'DNI' },
    { key: 'cuil', label: 'CUIL' },
    { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', format: formatFecha },
    { key: 'sexo', label: 'Sexo', format: normalizar },
    { key: 'tipo_documento', label: 'Tipo Documento', format: normalizar },
    { key: 'nacionalidad', label: 'Nacionalidad', format: normalizar },
  ];

  // Datos laborales (NO editables excepto cuenta bancaria)
  const datosLaborales = [
    { key: 'legajo', label: 'Legajo' },
    { key: 'fecha_ingreso', label: 'Fecha de ingreso', format: formatFecha },
    { key: 'centro_costos', label: 'Centro de costos' },
    { key: 'tarea_desempenada', label: 'Tarea' },
  ];

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(90deg, #e3f2fd 0%, #fff 100%)', minHeight: '100vh' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 700, margin: '0 auto', borderRadius: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: '#1976d2', width: 64, height: 64, mr: 2 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {legajo.nombre} {legajo.apellido}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Legajo: {legajo.legajo} | DNI: {legajo.nro_documento}
            </Typography>
          </Box>
          {!modoEdicion && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditarClick}
              sx={{ bgcolor: '#1976d2' }}
            >
              Editar
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Datos personales - NO editables */}
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 2 }}>Datos de Identificación</Typography>
        <Grid container spacing={2}>
          {datosIdentificacion.map(({ key, label, format }) => (
            legajo[key] ? (
              <Grid item xs={12} sm={6} key={key}>
                <Paper elevation={1} sx={{ p: 2, mb: 1, background: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{label}</Typography>
                  <Typography variant="body1">{format ? format(legajo[key]) : legajo[key]}</Typography>
                </Paper>
              </Grid>
            ) : null
          ))}
        </Grid>

        {/* Estado Civil - EDITABLE */}
        <Typography variant="subtitle1" sx={{ color: '#1976d2', mt: 3, mb: 2 }}>Estado Civil</Typography>
        {modoEdicion ? (
          <TextField
            fullWidth
            label="Estado Civil"
            value={datosEditables.estado_civil}
            onChange={(e) => handleInputChange('estado_civil', e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        ) : (
          <Paper elevation={1} sx={{ p: 2, mb: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Estado Civil</Typography>
            <Typography variant="body1">{normalizar(legajo.estado_civil) || 'No especificado'}</Typography>
          </Paper>
        )}

        {/* Domicilio - EDITABLE */}
        <Typography variant="subtitle1" sx={{ color: '#1976d2', mt: 3, mb: 2 }}>Domicilio</Typography>
        {modoEdicion ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Domicilio"
                value={datosEditables.domicilio}
                onChange={(e) => handleInputChange('domicilio', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Localidad"
                value={datosEditables.localidad}
                onChange={(e) => handleInputChange('localidad', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código Postal"
                value={datosEditables.codigo_postal}
                onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Provincia"
                value={datosEditables.provincia}
                onChange={(e) => handleInputChange('provincia', e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {[
              { key: 'domicilio', label: 'Domicilio' },
              { key: 'localidad', label: 'Localidad' },
              { key: 'codigo_postal', label: 'Código Postal' },
              { key: 'provincia', label: 'Provincia' }
            ].map(({ key, label }) => (
              legajo[key] ? (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper elevation={1} sx={{ p: 2, mb: 1, background: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{label}</Typography>
                    <Typography variant="body1">{normalizar(legajo[key])}</Typography>
                  </Paper>
                </Grid>
              ) : null
            ))}
          </Grid>
        )}

        {/* Contacto - EDITABLE */}
        <Typography variant="subtitle1" sx={{ color: '#1976d2', mt: 3, mb: 2 }}>Contacto</Typography>
        {modoEdicion ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={datosEditables.telefono_contacto}
                onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Personal"
                type="email"
                value={datosEditables.email_personal}
                onChange={(e) => handleInputChange('email_personal', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contacto Emergencia"
                value={datosEditables.contacto_emergencia}
                onChange={(e) => handleInputChange('contacto_emergencia', e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {[
              { key: 'telefono_contacto', label: 'Teléfono' },
              { key: 'email_personal', label: 'Email Personal' },
              { key: 'contacto_emergencia', label: 'Contacto Emergencia' }
            ].map(({ key, label }) => (
              legajo[key] ? (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper elevation={1} sx={{ p: 2, mb: 1, background: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{label}</Typography>
                    <Typography variant="body1">{legajo[key]}</Typography>
                  </Paper>
                </Grid>
              ) : null
            ))}
          </Grid>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Datos laborales - NO editables (excepto cuenta bancaria) */}
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 2 }}>Datos Laborales</Typography>
        <Grid container spacing={2}>
          {datosLaborales.map(({ key, label, format }) => (
            legajo[key] ? (
              <Grid item xs={12} sm={6} key={key}>
                <Paper elevation={1} sx={{ p: 2, mb: 1, background: '#e3f2fd', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{label}</Typography>
                  <Typography variant="body1">{format ? format(legajo[key]) : legajo[key]}</Typography>
                </Paper>
              </Grid>
            ) : null
          ))}
        </Grid>

        {/* Datos bancarios - EDITABLE */}
        <Typography variant="subtitle1" sx={{ color: '#1976d2', mt: 3, mb: 2 }}>Datos Bancarios</Typography>
        {modoEdicion ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cuenta Bancaria"
                value={datosEditables.cuenta_bancaria}
                onChange={(e) => handleInputChange('cuenta_bancaria', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Banco"
                value={datosEditables.banco_destino}
                onChange={(e) => handleInputChange('banco_destino', e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {[
              { key: 'cuenta_bancaria', label: 'Cuenta Bancaria' },
              { key: 'banco_destino', label: 'Banco' }
            ].map(({ key, label }) => (
              legajo[key] ? (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper elevation={1} sx={{ p: 2, mb: 1, background: '#e3f2fd', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{label}</Typography>
                    <Typography variant="body1">{legajo[key]}</Typography>
                  </Paper>
                </Grid>
              ) : null
            ))}
          </Grid>
        )}

        {/* Botones de acción en modo edición */}
        {modoEdicion && (
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={guardando ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleGuardarClick}
              disabled={guardando}
              sx={{ minWidth: 150 }}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancelarClick}
              disabled={guardando}
              sx={{ minWidth: 150 }}
            >
              Cancelar
            </Button>
          </Box>
        )}

        <Divider sx={{ mt: 3, mb: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          {modoEdicion
            ? 'Estás editando tus datos personales. Puedes modificar domicilio, contacto y datos bancarios.'
            : 'Si necesitas modificar otros datos, comunicate con RRHH.'}
        </Typography>
      </Paper>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LegajoEmpleado;
