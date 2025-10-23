import { API_BASE_URL } from '../../config';
// src/pages/LegajoEmpleado.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Box, Paper, Grid, Avatar, Divider, Button, TextField, Alert, Snackbar } from '@mui/material';
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
  const [mensaje, setMensaje] = useState({ open: false, texto: '', tipo: 'success' });

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
        contacto_emergencia: res.data.contacto_emergencia || ''
      });
    })
    .catch(err => console.error(err));
  }, []);

  if (!legajo) return <Typography>Cargando legajo...</Typography>;

  // Funciones para manejo de edición
  const handleEditarClick = () => {
    setModoEdicion(true);
  };

  const handleCancelar = () => {
    // Restaurar valores originales
    setDatosEditables({
      domicilio: legajo.domicilio || '',
      localidad: legajo.localidad || '',
      codigo_postal: legajo.codigo_postal || '',
      provincia: legajo.provincia || '',
      telefono_contacto: legajo.telefono_contacto || '',
      contacto_emergencia: legajo.contacto_emergencia || ''
    });
    setModoEdicion(false);
  };

  const handleCambio = (campo, valor) => {
    setDatosEditables(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleGuardar = async () => {
    // Validaciones básicas
    if (datosEditables.codigo_postal && !/^\d{4,8}$/.test(datosEditables.codigo_postal)) {
      setMensaje({ open: true, texto: 'El código postal debe contener solo números (4-8 dígitos)', tipo: 'error' });
      return;
    }

    if (datosEditables.telefono_contacto && !/^[\d\s\-\+\(\)]{7,20}$/.test(datosEditables.telefono_contacto)) {
      setMensaje({ open: true, texto: 'El teléfono no tiene un formato válido', tipo: 'error' });
      return;
    }

    setGuardando(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/legajos/actualizar/${legajo.id}`,
        datosEditables,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      // Actualizar el legajo con los nuevos datos
      setLegajo(prev => ({ ...prev, ...datosEditables }));
      setModoEdicion(false);
      setMensaje({ open: true, texto: 'Datos actualizados correctamente', tipo: 'success' });
    } catch (error) {
      console.error('Error al actualizar legajo:', error);
      setMensaje({
        open: true,
        texto: error.response?.data?.error || 'Error al actualizar los datos',
        tipo: 'error'
      });
    } finally {
      setGuardando(false);
    }
  };

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

  // Normalizador de texto (primera letra mayúscula, resto minúscula, sin espacios extra)
  const normalizar = (txt) => {
    if (!txt || typeof txt !== 'string') return txt;
    return txt.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^(\w)(.*)/, (m, p1, p2) => p1.toUpperCase() + p2);
  };

  // Subgrupos de datos personales
  const datosIdentificacion = [
    { key: 'nombre', label: 'Nombre', format: normalizar },
    { key: 'apellido', label: 'Apellido', format: normalizar },
    { key: 'nro_documento', label: 'DNI' },
    { key: 'cuil', label: 'CUIL' },
    { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', format: formatFecha },
    { key: 'sexo', label: 'Sexo', format: normalizar },
    { key: 'estado_civil', label: 'Estado Civil', format: normalizar },
    { key: 'tipo_documento', label: 'Tipo Documento', format: normalizar },
    { key: 'nacionalidad', label: 'Nacionalidad', format: normalizar },
    
  ];

  const datosDomicilio = [
    { key: 'domicilio', label: 'Domicilio', format: normalizar },
    { key: 'localidad', label: 'Localidad', format: normalizar },
    { key: 'codigo_postal', label: 'Código Postal' },
    { key: 'provincia', label: 'Provincia', format: normalizar },
  ];

  const datosContacto = [
    { key: 'telefono_contacto', label: 'Teléfono' },
    { key: 'contacto_emergencia', label: 'Contacto Emergencia', format: normalizar },
  ];

  const datosLaborales = [
    { key: 'legajo', label: 'Legajo' },
    { key: 'fecha_ingreso', label: 'Fecha de ingreso', format: formatFecha },
    { key: 'centro_costos', label: 'Centro de costos' },
    { key: 'tarea_desempenada', label: 'Tarea' },
    { key: 'cuenta_bancaria', label: 'Cuenta Bancaria' },
    { key: 'banco_destino', label: 'Banco' },
    // ...agrega más si tu tabla tiene más campos laborales
  ];

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(90deg, #e3f2fd 0%, #fff 100%)', minHeight: '100vh' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 700, margin: '0 auto', borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: '#1976d2', width: 64, height: 64, mr: 2 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {legajo.nombre} {legajo.apellido}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Legajo: {legajo.legajo} | DNI: {legajo.nro_documento}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 2 }}>Datos personales</Typography>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ color: '#1976d2' }}>Domicilio</Typography>
          {!modoEdicion && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditarClick}
              size="small"
            >
              Editar
            </Button>
          )}
        </Box>
        <Grid container spacing={2}>
          {modoEdicion ? (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Domicilio"
                  value={datosEditables.domicilio}
                  onChange={(e) => handleCambio('domicilio', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Localidad"
                  value={datosEditables.localidad}
                  onChange={(e) => handleCambio('localidad', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código Postal"
                  value={datosEditables.codigo_postal}
                  onChange={(e) => handleCambio('codigo_postal', e.target.value)}
                  variant="outlined"
                  size="small"
                  inputProps={{ maxLength: 8 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Provincia"
                  value={datosEditables.provincia}
                  onChange={(e) => handleCambio('provincia', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </>
          ) : (
            datosDomicilio.map(({ key, label, format }) => (
              legajo[key] ? (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper elevation={1} sx={{ p: 2, mb: 1, background: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{label}</Typography>
                    <Typography variant="body1">{format ? format(legajo[key]) : legajo[key]}</Typography>
                  </Paper>
                </Grid>
              ) : null
            ))
          )}
        </Grid>
        <Typography variant="subtitle1" sx={{ color: '#1976d2', mt: 3, mb: 1 }}>Contacto</Typography>
        <Grid container spacing={2}>
          {modoEdicion ? (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={datosEditables.telefono_contacto}
                  onChange={(e) => handleCambio('telefono_contacto', e.target.value)}
                  variant="outlined"
                  size="small"
                  placeholder="+54 11 1234-5678"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contacto Emergencia"
                  value={datosEditables.contacto_emergencia}
                  onChange={(e) => handleCambio('contacto_emergencia', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </>
          ) : (
            datosContacto.map(({ key, label, format }) => (
              legajo[key] ? (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper elevation={1} sx={{ p: 2, mb: 1, background: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{label}</Typography>
                    <Typography variant="body1">{format ? format(legajo[key]) : legajo[key]}</Typography>
                  </Paper>
                </Grid>
              ) : null
            ))
          )}
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 2 }}>Datos laborales</Typography>
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
        <Divider sx={{ mt: 3, mb: 2 }} />
        {modoEdicion ? (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleGuardar}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CancelIcon />}
              onClick={handleCancelar}
              disabled={guardando}
            >
              Cancelar
            </Button>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            Si algún dato laboral es incorrecto, comunicate con RRHH.
          </Typography>
        )}
      </Paper>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={mensaje.open}
        autoHideDuration={6000}
        onClose={() => setMensaje({ ...mensaje, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setMensaje({ ...mensaje, open: false })}
          severity={mensaje.tipo}
          sx={{ width: '100%' }}
        >
          {mensaje.texto}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LegajoEmpleado;
