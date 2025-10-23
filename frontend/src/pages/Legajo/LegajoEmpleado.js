import { API_BASE_URL } from '../../config';
// src/pages/LegajoEmpleado.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Typography, Box, Paper, Grid, Avatar, Divider, Button, TextField,
  Alert, Snackbar, MenuItem, Select, FormControl, InputLabel
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
  const [mensaje, setMensaje] = useState({ open: false, texto: '', tipo: 'success' });

  useEffect(() => {
  axios.get(`${API_BASE_URL}/api/legajos/mi-legajo`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    .then(res => {
      setLegajo(res.data);
      // Inicializar datos editables (todos excepto DNI y CUIL)
      setDatosEditables({
        nombre: res.data.nombre || '',
        apellido: res.data.apellido || '',
        fecha_nacimiento: res.data.fecha_nacimiento ? res.data.fecha_nacimiento.split('T')[0] : '',
        sexo: res.data.sexo || '',
        estado_civil: res.data.estado_civil || '',
        tipo_documento: res.data.tipo_documento || '',
        nacionalidad: res.data.nacionalidad || '',
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
      nombre: legajo.nombre || '',
      apellido: legajo.apellido || '',
      fecha_nacimiento: legajo.fecha_nacimiento ? legajo.fecha_nacimiento.split('T')[0] : '',
      sexo: legajo.sexo || '',
      estado_civil: legajo.estado_civil || '',
      tipo_documento: legajo.tipo_documento || '',
      nacionalidad: legajo.nacionalidad || '',
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
    if (!datosEditables.nombre || !datosEditables.apellido) {
      setMensaje({ open: true, texto: 'Nombre y apellido son obligatorios', tipo: 'error' });
      return;
    }

    if (datosEditables.codigo_postal && !/^\d{4,8}$/.test(datosEditables.codigo_postal)) {
      setMensaje({ open: true, texto: 'El código postal debe contener solo números (4-8 dígitos)', tipo: 'error' });
      return;
    }

    if (datosEditables.telefono_contacto && !/^[\d\s\-\+\(\)]{7,20}$/.test(datosEditables.telefono_contacto)) {
      setMensaje({ open: true, texto: 'El teléfono no tiene un formato válido', tipo: 'error' });
      return;
    }

    if (datosEditables.fecha_nacimiento) {
      const fechaNac = new Date(datosEditables.fecha_nacimiento);
      const hoy = new Date();
      const edad = (hoy - fechaNac) / (1000 * 60 * 60 * 24 * 365.25);
      if (edad < 16 || edad > 100) {
        setMensaje({ open: true, texto: 'La fecha de nacimiento no es válida', tipo: 'error' });
        return;
      }
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

  // Componente para campo de solo lectura
  const CampoLectura = ({ label, valor }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: '#000' }}>
        {valor || '-'}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(90deg, #e3f2fd 0%, #fff 100%)', minHeight: '100vh' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 900, margin: '0 auto', borderRadius: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: '#1976d2', width: 64, height: 64, mr: 2 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Mi Legajo
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Legajo: {legajo.legajo}
              </Typography>
            </Box>
          </Box>
          {!modoEdicion && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditarClick}
              sx={{ bgcolor: '#1976d2' }}
            >
              Editar Datos
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Datos Personales */}
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 3, fontWeight: 'bold' }}>
          Datos Personales
        </Typography>

        <Grid container spacing={3}>
          {/* Nombre */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Nombre"
                value={datosEditables.nombre}
                onChange={(e) => handleCambio('nombre', e.target.value)}
                variant="outlined"
                required
              />
            ) : (
              <CampoLectura label="Nombre" valor={legajo.nombre} />
            )}
          </Grid>

          {/* Apellido */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Apellido"
                value={datosEditables.apellido}
                onChange={(e) => handleCambio('apellido', e.target.value)}
                variant="outlined"
                required
              />
            ) : (
              <CampoLectura label="Apellido" valor={legajo.apellido} />
            )}
          </Grid>

          {/* DNI - Solo lectura */}
          <Grid item xs={12} sm={6}>
            <CampoLectura label="DNI" valor={legajo.nro_documento} />
          </Grid>

          {/* CUIL - Solo lectura */}
          <Grid item xs={12} sm={6}>
            <CampoLectura label="CUIL" valor={legajo.cuil} />
          </Grid>

          {/* Tipo Documento */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <FormControl fullWidth>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={datosEditables.tipo_documento}
                  onChange={(e) => handleCambio('tipo_documento', e.target.value)}
                  label="Tipo de Documento"
                >
                  <MenuItem value="DNI">DNI</MenuItem>
                  <MenuItem value="LC">LC</MenuItem>
                  <MenuItem value="LE">LE</MenuItem>
                  <MenuItem value="Pasaporte">Pasaporte</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <CampoLectura label="Tipo de Documento" valor={legajo.tipo_documento} />
            )}
          </Grid>

          {/* Fecha Nacimiento */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                type="date"
                value={datosEditables.fecha_nacimiento}
                onChange={(e) => handleCambio('fecha_nacimiento', e.target.value)}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            ) : (
              <CampoLectura label="Fecha de Nacimiento" valor={formatFecha(legajo.fecha_nacimiento)} />
            )}
          </Grid>

          {/* Sexo */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <FormControl fullWidth>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={datosEditables.sexo}
                  onChange={(e) => handleCambio('sexo', e.target.value)}
                  label="Sexo"
                >
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <CampoLectura label="Sexo" valor={legajo.sexo} />
            )}
          </Grid>

          {/* Estado Civil */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <FormControl fullWidth>
                <InputLabel>Estado Civil</InputLabel>
                <Select
                  value={datosEditables.estado_civil}
                  onChange={(e) => handleCambio('estado_civil', e.target.value)}
                  label="Estado Civil"
                >
                  <MenuItem value="Soltero">Soltero</MenuItem>
                  <MenuItem value="Casado">Casado</MenuItem>
                  <MenuItem value="Divorciado">Divorciado</MenuItem>
                  <MenuItem value="Viudo">Viudo</MenuItem>
                  <MenuItem value="Unión Convivencial">Unión Convivencial</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <CampoLectura label="Estado Civil" valor={legajo.estado_civil} />
            )}
          </Grid>

          {/* Nacionalidad */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Nacionalidad"
                value={datosEditables.nacionalidad}
                onChange={(e) => handleCambio('nacionalidad', e.target.value)}
                variant="outlined"
              />
            ) : (
              <CampoLectura label="Nacionalidad" valor={legajo.nacionalidad} />
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Domicilio */}
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 3, fontWeight: 'bold' }}>
          Domicilio
        </Typography>

        <Grid container spacing={3}>
          {/* Domicilio */}
          <Grid item xs={12}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Domicilio"
                value={datosEditables.domicilio}
                onChange={(e) => handleCambio('domicilio', e.target.value)}
                variant="outlined"
              />
            ) : (
              <CampoLectura label="Domicilio" valor={legajo.domicilio} />
            )}
          </Grid>

          {/* Localidad */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Localidad"
                value={datosEditables.localidad}
                onChange={(e) => handleCambio('localidad', e.target.value)}
                variant="outlined"
              />
            ) : (
              <CampoLectura label="Localidad" valor={legajo.localidad} />
            )}
          </Grid>

          {/* Provincia */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Provincia"
                value={datosEditables.provincia}
                onChange={(e) => handleCambio('provincia', e.target.value)}
                variant="outlined"
              />
            ) : (
              <CampoLectura label="Provincia" valor={legajo.provincia} />
            )}
          </Grid>

          {/* Código Postal */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Código Postal"
                value={datosEditables.codigo_postal}
                onChange={(e) => handleCambio('codigo_postal', e.target.value)}
                variant="outlined"
                inputProps={{ maxLength: 8 }}
              />
            ) : (
              <CampoLectura label="Código Postal" valor={legajo.codigo_postal} />
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Contacto */}
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 3, fontWeight: 'bold' }}>
          Contacto
        </Typography>

        <Grid container spacing={3}>
          {/* Teléfono */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Teléfono"
                value={datosEditables.telefono_contacto}
                onChange={(e) => handleCambio('telefono_contacto', e.target.value)}
                variant="outlined"
                placeholder="+54 11 1234-5678"
              />
            ) : (
              <CampoLectura label="Teléfono" valor={legajo.telefono_contacto} />
            )}
          </Grid>

          {/* Contacto Emergencia */}
          <Grid item xs={12} sm={6}>
            {modoEdicion ? (
              <TextField
                fullWidth
                label="Contacto de Emergencia"
                value={datosEditables.contacto_emergencia}
                onChange={(e) => handleCambio('contacto_emergencia', e.target.value)}
                variant="outlined"
              />
            ) : (
              <CampoLectura label="Contacto de Emergencia" valor={legajo.contacto_emergencia} />
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Datos Laborales - Solo lectura */}
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 3, fontWeight: 'bold' }}>
          Datos Laborales
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <CampoLectura label="Fecha de Ingreso" valor={formatFecha(legajo.fecha_ingreso)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CampoLectura label="Centro de Costos" valor={legajo.centro_costos} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CampoLectura label="Tarea" valor={legajo.tarea_desempenada} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CampoLectura label="Banco" valor={legajo.banco_destino} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CampoLectura label="Cuenta Bancaria" valor={legajo.cuenta_bancaria} />
          </Grid>
        </Grid>

        {/* Botones de acción */}
        <Divider sx={{ my: 4 }} />

        {modoEdicion ? (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleGuardar}
              disabled={guardando}
              size="large"
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CancelIcon />}
              onClick={handleCancelar}
              disabled={guardando}
              size="large"
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
