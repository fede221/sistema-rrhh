import { API_BASE_URL } from '../../config';
// src/pages/LegajoEmpleado.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Typography, Box, Paper, Avatar, Divider, Button, TextField,
  Alert, Snackbar, MenuItem, Select, FormControl,
  Chip, Fade, Zoom
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
// removed unused icons: FingerprintIcon, WcIcon, FavoriteIcon
import PublicIcon from '@mui/icons-material/Public';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
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

  // CampoCard removed: using InfoRow for unified styling across the page

  // Reusable row component: left label (blue), right value/input
  const InfoRow = ({ label, campoKey, value, editable = false, type, options = [], icon: Icon, color = '#1976d2', index = 0 }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 3, bgcolor: index % 2 === 0 ? 'white' : '#fbfdff', borderBottom: '1px solid #e6eef9' }}>
      <Box sx={{ width: 220, display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <Avatar sx={{ bgcolor: color, width: 32, height: 32, mr: 1.5 }}>
            <Icon sx={{ fontSize: 18 }} />
          </Avatar>
        )}
        <Typography sx={{ color: color, fontWeight: 700 }}>{label}</Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        {modoEdicion && editable ? (
          type === 'date' ? (
            <TextField type="date" value={datosEditables[campoKey]} onChange={(e) => handleCambio(campoKey, e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          ) : type === 'select' ? (
            <FormControl fullWidth>
              <Select value={datosEditables[campoKey]} onChange={(e) => handleCambio(campoKey, e.target.value)}>
                {options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
          ) : (
            <TextField fullWidth value={datosEditables[campoKey] || ''} onChange={(e) => handleCambio(campoKey, e.target.value)} />
          )
        ) : (
          <Typography sx={{ color: '#333' }}>{(datosEditables[campoKey] !== undefined && datosEditables[campoKey] !== '') ? datosEditables[campoKey] : (value !== undefined ? value : (legajo[campoKey] || '-'))}</Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(90deg, #e3f2fd 0%, #fff 100%)', minHeight: '100vh' }}>
      <Zoom in={true} timeout={500}>
        <Paper
          elevation={8}
          sx={{
            p: 4,
            maxWidth: 800,
            margin: '0 auto',
            borderRadius: 4,
            background: '#ffffff'
          }}
        >
          {/* Header */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            boxShadow: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{
                bgcolor: 'white',
                color: '#667eea',
                width: 70,
                height: 70,
                mr: 2,
                boxShadow: 3
              }}>
                <PersonIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 0.5 }}>
                  {legajo.nombre} {legajo.apellido}
                </Typography>
                <Chip
                  label={`Legajo: ${legajo.legajo}`}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </Box>
            </Box>
            {!modoEdicion && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditarClick}
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  fontWeight: 'bold',
                  px: 3,
                  '&:hover': {
                    bgcolor: '#f0f0f0',
                    transform: 'scale(1.05)',
                    boxShadow: 4
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Editar Datos
              </Button>
            )}
          </Box>

          {/* Datos Personales (estilo tabla) */}
          <Fade in={true} timeout={800}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#e8f4ff', color: '#1976d2', mr: 2 }}>
                    <BadgeIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    Datos Personales
                  </Typography>
                </Box>
                {!modoEdicion && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleEditarClick}
                    startIcon={<EditIcon />}
                    sx={{ bgcolor: '#1976d2', textTransform: 'none' }}
                  >
                    EDITAR DATOS PERSONALES
                  </Button>
                )}
              </Box>

              <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                {/* Rows: left label (blue), right value/input */}
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
                    sx={{ display: 'flex', alignItems: 'center', py: 2, px: 3, bgcolor: idx % 2 === 0 ? 'white' : '#fbfdff', borderBottom: '1px solid #e6eef9' }}
                  >
                    <Box sx={{ width: 220 }}>
                      <Typography sx={{ color: '#1976d2', fontWeight: 700 }}>{field.label}</Typography>
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
                          // show value from datosEditables if present (after save) else from legajo
                          (datosEditables[field.key] !== undefined && datosEditables[field.key] !== '') ? datosEditables[field.key] : (field.value !== undefined ? field.value : (legajo[field.key] || '-'))
                        }</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Fade>
 

          <Divider sx={{ my: 4, borderStyle: 'dashed', borderColor: '#667eea', opacity: 0.3 }} />

          {/* Domicilio */}
          <Fade in={true} timeout={1000}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#43a047', mr: 2, boxShadow: 2 }}>
                  <HomeIcon />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#43a047' }}>
                  Domicilio
                </Typography>
              </Box>

              <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                {[
                  { key: 'domicilio', label: 'Domicilio', editable: true, icon: HomeIcon },
                  { key: 'localidad', label: 'Localidad', editable: true, icon: LocationOnIcon },
                  { key: 'provincia', label: 'Provincia', editable: true, icon: PublicIcon },
                  { key: 'codigo_postal', label: 'Código Postal', editable: true, icon: LocationOnIcon }
                ].map((f, i) => (
                  <InfoRow key={f.key} label={f.label} campoKey={f.key} editable={f.editable} icon={f.icon} color="#43a047" index={i} />
                ))}
              </Box>
            </Box>
          </Fade>

          <Divider sx={{ my: 4, borderStyle: 'dashed', borderColor: '#43a047', opacity: 0.3 }} />

          {/* Contacto */}
          <Fade in={true} timeout={1200}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#fb8c00', mr: 2, boxShadow: 2 }}>
                  <PhoneIcon />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fb8c00' }}>
                  Contacto
                </Typography>
              </Box>

              <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                {[
                  { key: 'telefono_contacto', label: 'Teléfono', editable: true, icon: PhoneIcon },
                  { key: 'contacto_emergencia', label: 'Contacto Emergencia', editable: true, icon: ContactPhoneIcon }
                ].map((f, i) => (
                  <InfoRow key={f.key} label={f.label} campoKey={f.key} editable={f.editable} icon={f.icon} color="#fb8c00" index={i} />
                ))}
              </Box>
            </Box>
          </Fade>

          <Divider sx={{ my: 4, borderStyle: 'dashed', borderColor: '#fb8c00', opacity: 0.3 }} />

          {/* Datos Laborales - Solo lectura */}
          <Fade in={true} timeout={1400}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#5c6bc0', mr: 2, boxShadow: 2 }}>
                  <WorkIcon />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#5c6bc0' }}>
                  Datos Laborales
                </Typography>
                <Chip
                  label="Solo lectura"
                  size="small"
                  sx={{ ml: 2, bgcolor: '#e8eaf6', color: '#5c6bc0', fontWeight: 'bold' }}
                />
              </Box>

              <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', boxShadow: 1 }}>
                {[
                  { key: 'fecha_ingreso', label: 'Fecha Ingreso', editable: false, icon: CalendarMonthIcon },
                  { key: 'centro_costos', label: 'Centro de Costos', editable: false, icon: WorkIcon },
                  { key: 'tarea_desempenada', label: 'Tarea', editable: false, icon: AssignmentIcon },
                  { key: 'banco_destino', label: 'Banco', editable: false, icon: AccountBalanceIcon },
                  { key: 'cuenta_bancaria', label: 'Cuenta Bancaria', editable: false, icon: AccountBalanceIcon }
                ].map((f, i) => (
                  <InfoRow key={f.key} label={f.label} campoKey={f.key} editable={f.editable} icon={f.icon} color="#5c6bc0" index={i} value={f.key === 'fecha_ingreso' ? formatFecha(legajo.fecha_ingreso) : undefined} />
                ))}
              </Box>
            </Box>
          </Fade>

          {/* Botones de acción */}
          <Divider sx={{ my: 4, borderStyle: 'solid', borderWidth: 2, borderColor: '#667eea', opacity: 0.2 }} />

          {modoEdicion ? (
            <Zoom in={true}>
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleGuardar}
                  disabled={guardando}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 'bold',
                    px: 5,
                    py: 1.5,
                    borderRadius: 3,
                    boxShadow: 4,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      transform: 'scale(1.05)',
                      boxShadow: 6
                    },
                    '&:disabled': {
                      background: '#ccc'
                    },
                    transition: 'all 0.3s ease'
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
                    borderColor: '#f50057',
                    color: '#f50057',
                    fontWeight: 'bold',
                    px: 5,
                    py: 1.5,
                    borderRadius: 3,
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: '#f50057',
                      bgcolor: '#f500570a',
                      borderWidth: 2,
                      transform: 'scale(1.05)',
                      boxShadow: 4
                    },
                    transition: 'all 0.3s ease'
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
                p: 3,
                background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                borderRadius: 3,
                border: '2px dashed #667eea'
              }}
            >
              <Typography variant="body1" align="center" sx={{ color: '#667eea', fontWeight: 500 }}>
                💼 Si algún dato laboral es incorrecto, comunicate con RRHH.
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
