import { API_BASE_URL } from '../../config';
// src/pages/LegajoEmpleado.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Typography, Box, Paper, Avatar, Divider, Button, TextField,
  Alert, Snackbar, MenuItem, Select, FormControl,
  Chip, Fade, Zoom
} from '@mui/material';
// PersonIcon removed - using initials avatar
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import { getToken } from '../../utils/auth';

// Unified color scheme - Consistente con la app
const primaryColor = '#1976d2';
const iconBg = '#e8f4ff';
const lightGray = '#fbfdff';
const borderColor = '#e6eef9';

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

    if (datosEditables.telefono_contacto && !/^[0-9\s\-+()]{7,20}$/.test(datosEditables.telefono_contacto)) {
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

  // Helper para obtener iniciales (primera letra del primer nombre y primera letra del apellido)
  const getInitials = (nombre = '', apellido = '') => {
    try {
      const first = nombre ? nombre.trim().split(' ')[0].charAt(0).toUpperCase() : '';
      const last = apellido ? apellido.trim().split(' ')[0].charAt(0).toUpperCase() : '';
      return `${first}${last}` || '';
    } catch (e) {
      return '';
    }
  };

  // CampoCard removed: using inline rendering for unified styling

  return (
    <Box sx={{ p: 3, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
      <Zoom in={true} timeout={500}>
        <Paper
          elevation={1}
          sx={{
            p: 4,
            maxWidth: 900,
            margin: '0 auto',
            borderRadius: 2,
            bgcolor: 'white'
          }}
        >
          {/* Header */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            p: 3,
            bgcolor: primaryColor,
            borderRadius: 2,
            boxShadow: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{
                bgcolor: 'white',
                color: primaryColor,
                width: 70,
                height: 70,
                mr: 2,
                boxShadow: 2,
                fontWeight: 'bold'
              }}>
                <Typography sx={{ color: primaryColor, fontWeight: '700', fontSize: 28 }}>
                  {getInitials(legajo.nombre, legajo.apellido)}
                </Typography>
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 0.5 }}>
                  {legajo.nombre} {legajo.apellido}
                </Typography>
                {legajo.legajo ? (
                  <Chip
                    label={`Legajo: ${legajo.legajo}`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                ) : null}
              </Box>
            </Box>
          </Box>

          {/* Datos Personales (estilo tabla) */}
          <Fade in={true} timeout={800}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: iconBg, color: primaryColor, mr: 2 }}>
                    <BadgeIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryColor }}>
                    Datos Personales
                  </Typography>
                </Box>
                {!modoEdicion && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleEditarClick}
                    startIcon={<EditIcon />}
                    sx={{ bgcolor: primaryColor, textTransform: 'none' }}
                  >
                    EDITAR
                  </Button>
                )}
              </Box>

              <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                {[
                  { key: 'nombre', label: 'Nombre', editable: true },
                  { key: 'apellido', label: 'Apellido', editable: true },
                  { key: 'nro_documento', label: 'DNI', editable: false, value: legajo.nro_documento },
                  { key: 'cuil', label: 'CUIL', editable: false, value: legajo.cuil },
                  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', editable: true, type: 'date' },
                  { key: 'sexo', label: 'Sexo', editable: true, type: 'select', options: ['Masculino', 'Femenino', 'Otro'] },
                  { key: 'estado_civil', label: 'Estado Civil', editable: true, type: 'select', options: ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Unión Convivencial'] },
                  { key: 'tipo_documento', label: 'Tipo de Documento', editable: true, type: 'select', options: ['DNI', 'LC', 'LE', 'Pasaporte'] },
                  { key: 'nacionalidad', label: 'Nacionalidad', editable: true }
                ].map((field, idx) => (
                  <Box
                    key={field.key}
                    sx={{ display: 'flex', alignItems: 'center', py: 2, px: 3, bgcolor: idx % 2 === 0 ? 'white' : lightGray, borderBottom: `1px solid ${borderColor}` }}
                  >
                    <Box sx={{ width: 220 }}>
                      <Typography sx={{ color: primaryColor, fontWeight: 700 }}>{field.label}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {modoEdicion && field.editable ? (
                        field.type === 'date' ? (
                          <TextField
                            type="date"
                            value={datosEditables.fecha_nacimiento}
                            onChange={(e) => handleCambio('fecha_nacimiento', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        ) : field.type === 'select' ? (
                          <FormControl fullWidth>
                            <Select
                              value={datosEditables[field.key]}
                              onChange={(e) => handleCambio(field.key, e.target.value)}
                            >
                              {field.options.map(opt => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField
                            fullWidth
                            value={datosEditables[field.key] || ''}
                            onChange={(e) => handleCambio(field.key, e.target.value)}
                          />
                        )
                      ) : (
                        <Typography sx={{ color: '#333' }}>{
                          (datosEditables[field.key] !== undefined && datosEditables[field.key] !== '') ? datosEditables[field.key] : (field.value !== undefined ? field.value : (legajo[field.key] || '-'))
                        }</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Fade>

          <Divider sx={{ my: 4 }} />

          {/* Domicilio */}
          <Fade in={true} timeout={1000}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: iconBg, color: primaryColor, mr: 2 }}>
                  <HomeIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryColor }}>
                  Domicilio
                </Typography>
              </Box>

              <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                {[
                  { key: 'domicilio', label: 'Domicilio', editable: true },
                  { key: 'localidad', label: 'Localidad', editable: true },
                  { key: 'provincia', label: 'Provincia', editable: true },
                  { key: 'codigo_postal', label: 'Código Postal', editable: true }
                ].map((f, i) => (
                  <Box
                    key={f.key}
                    sx={{ display: 'flex', alignItems: 'center', py: 2, px: 3, bgcolor: i % 2 === 0 ? 'white' : lightGray, borderBottom: `1px solid ${borderColor}` }}
                  >
                    <Box sx={{ width: 220 }}>
                      <Typography sx={{ color: primaryColor, fontWeight: 700 }}>{f.label}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {modoEdicion && f.editable ? (
                        <TextField
                          fullWidth
                          value={datosEditables[f.key] || ''}
                          onChange={(e) => handleCambio(f.key, e.target.value)}
                        />
                      ) : (
                        <Typography sx={{ color: '#333' }}>{datosEditables[f.key] || legajo[f.key] || '-'}</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Fade>

          <Divider sx={{ my: 4 }} />

          {/* Contacto */}
          <Fade in={true} timeout={1200}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: iconBg, color: primaryColor, mr: 2 }}>
                  <PhoneIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryColor }}>
                  Contacto
                </Typography>
              </Box>

              <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                {[
                  { key: 'telefono_contacto', label: 'Teléfono', editable: true },
                  { key: 'contacto_emergencia', label: 'Contacto Emergencia', editable: true }
                ].map((f, i) => (
                  <Box
                    key={f.key}
                    sx={{ display: 'flex', alignItems: 'center', py: 2, px: 3, bgcolor: i % 2 === 0 ? 'white' : lightGray, borderBottom: `1px solid ${borderColor}` }}
                  >
                    <Box sx={{ width: 220 }}>
                      <Typography sx={{ color: primaryColor, fontWeight: 700 }}>{f.label}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {modoEdicion && f.editable ? (
                        <TextField
                          fullWidth
                          value={datosEditables[f.key] || ''}
                          onChange={(e) => handleCambio(f.key, e.target.value)}
                        />
                      ) : (
                        <Typography sx={{ color: '#333' }}>{datosEditables[f.key] || legajo[f.key] || '-'}</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Fade>

          <Divider sx={{ my: 4 }} />

          {/* Datos Laborales - Solo lectura */}
          <Fade in={true} timeout={1400}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: iconBg, color: primaryColor, mr: 2 }}>
                  <WorkIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryColor }}>
                  Datos Laborales
                </Typography>
                <Chip
                  label="Solo lectura"
                  size="small"
                  sx={{ ml: 2, bgcolor: iconBg, color: primaryColor, fontWeight: 'bold' }}
                />
              </Box>

              <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                {[
                  { key: 'fecha_ingreso', label: 'Fecha Ingreso' },
                  { key: 'centro_costos', label: 'Centro de Costos' },
                  { key: 'tarea_desempenada', label: 'Tarea' },
                  { key: 'banco_destino', label: 'Banco' },
                  { key: 'cuenta_bancaria', label: 'Cuenta Bancaria' }
                ].map((f, i) => (
                  <Box
                    key={f.key}
                    sx={{ display: 'flex', alignItems: 'center', py: 2, px: 3, bgcolor: i % 2 === 0 ? 'white' : lightGray, borderBottom: `1px solid ${borderColor}` }}
                  >
                    <Box sx={{ width: 220 }}>
                      <Typography sx={{ color: primaryColor, fontWeight: 700 }}>{f.label}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: '#333' }}>
                        {f.key === 'fecha_ingreso' ? formatFecha(legajo.fecha_ingreso) : (legajo[f.key] || '-')}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Fade>

          {/* Botones de acción */}
          <Divider sx={{ my: 4 }} />

          {modoEdicion ? (
            <Zoom in={true}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleGuardar}
                  disabled={guardando}
                  size="large"
                  sx={{
                    bgcolor: primaryColor,
                    color: 'white',
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.2,
                    borderRadius: 1,
                    boxShadow: 1,
                    '&:hover': {
                      bgcolor: '#1565c0',
                      boxShadow: 2
                    },
                    '&:disabled': {
                      bgcolor: '#ccc'
                    }
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelar}
                  disabled={guardando}
                  size="large"
                  sx={{
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.2,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: '#d32f2f10',
                      borderColor: '#d32f2f'
                    }
                  }}
                >
                  Cancelar
                </Button>
              </Box>
            </Zoom>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                border: `1px solid ${borderColor}`
              }}
            >
              <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
                Si algún dato laboral es incorrecto, comunícate con RRHH.
              </Typography>
            </Paper>
          )}
        </Paper>
      </Zoom>

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
