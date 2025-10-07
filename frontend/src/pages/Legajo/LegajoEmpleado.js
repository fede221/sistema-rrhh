import { API_BASE_URL } from '../../config';
// src/pages/LegajoEmpleado.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Box, Paper, Grid, Avatar, Divider } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { getToken } from '../../utils/auth';

const LegajoEmpleado = () => {
  const [legajo, setLegajo] = useState(null);

  useEffect(() => {
  axios.get(`${API_BASE_URL}/api/legajos/mi-legajo`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    .then(res => setLegajo(res.data))
    .catch(err => console.error(err));
  }, []);

  if (!legajo) return <Typography>Cargando legajo...</Typography>;

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
        <Typography variant="subtitle1" sx={{ color: '#1976d2', mt: 3, mb: 1 }}>Domicilio</Typography>
        <Grid container spacing={2}>
          {datosDomicilio.map(({ key, label, format }) => (
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
        <Typography variant="subtitle1" sx={{ color: '#1976d2', mt: 3, mb: 1 }}>Contacto</Typography>
        <Grid container spacing={2}>
          {datosContacto.map(({ key, label, format }) => (
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
        <Typography variant="body2" color="text.secondary" align="center">
          Si algún dato es incorrecto, comunicate con RRHH.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LegajoEmpleado;
