import { API_BASE_URL } from '../../config';
// src/pages/LegajoEmpleado.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Typography, Box, Paper, Grid, Avatar, Divider, Button, TextField,
  Alert, Snackbar, MenuItem, Select, FormControl, InputLabel, Card, CardContent,
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
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import WcIcon from '@mui/icons-material/Wc';
import FavoriteIcon from '@mui/icons-material/Favorite';
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

  // Componente para campo de solo lectura con card
  const CampoCard = ({ label, valor, icon: Icon, color = '#1976d2' }) => (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          borderLeft: `4px solid ${color}`
        },
        borderLeft: '4px solid transparent',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {Icon && (
            <Avatar sx={{ bgcolor: color, width: 32, height: 32, mr: 1.5 }}>
              <Icon sx={{ fontSize: 18 }} />
            </Avatar>
          )}
          <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#000', fontWeight: 500, ml: Icon ? 5.5 : 0 }}>
          {valor || '-'}
        </Typography>
      </CardContent>
    </Card>
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

          {/* Datos Personales */}
          <Fade in={true} timeout={800}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#667eea', mr: 2, boxShadow: 2 }}>
                  <BadgeIcon />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                  Datos Personales
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                {/* Nombre */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Nombre"
                      value={datosEditables.nombre}
                      onChange={(e) => handleCambio('nombre', e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <BadgeIcon sx={{ mr: 1, color: '#667eea' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Nombre" valor={legajo.nombre} icon={BadgeIcon} color="#667eea" />
                  )}
                </Grid>

                {/* Apellido */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Apellido"
                      value={datosEditables.apellido}
                      onChange={(e) => handleCambio('apellido', e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <BadgeIcon sx={{ mr: 1, color: '#667eea' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Apellido" valor={legajo.apellido} icon={BadgeIcon} color="#667eea" />
                  )}
                </Grid>

                {/* DNI - Solo lectura */}
                <Grid item xs={12}>
                  <CampoCard label="DNI" valor={legajo.nro_documento} icon={FingerprintIcon} color="#f50057" />
                </Grid>

                {/* CUIL - Solo lectura */}
                <Grid item xs={12}>
                  <CampoCard label="CUIL" valor={legajo.cuil} icon={FingerprintIcon} color="#f50057" />
                </Grid>

                {/* Tipo Documento */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Documento</InputLabel>
                      <Select
                        value={datosEditables.tipo_documento}
                        onChange={(e) => handleCambio('tipo_documento', e.target.value)}
                        label="Tipo de Documento"
                        sx={{
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                        }}
                      >
                        <MenuItem value="DNI">DNI</MenuItem>
                        <MenuItem value="LC">LC</MenuItem>
                        <MenuItem value="LE">LE</MenuItem>
                        <MenuItem value="Pasaporte">Pasaporte</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <CampoCard label="Tipo Documento" valor={legajo.tipo_documento} icon={AssignmentIcon} color="#667eea" />
                  )}
                </Grid>

                {/* Fecha Nacimiento */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Fecha de Nacimiento"
                      type="date"
                      value={datosEditables.fecha_nacimiento}
                      onChange={(e) => handleCambio('fecha_nacimiento', e.target.value)}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <CalendarMonthIcon sx={{ mr: 1, color: '#667eea' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Fecha Nacimiento" valor={formatFecha(legajo.fecha_nacimiento)} icon={CalendarMonthIcon} color="#667eea" />
                  )}
                </Grid>

                {/* Sexo */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <FormControl fullWidth>
                      <InputLabel>Sexo</InputLabel>
                      <Select
                        value={datosEditables.sexo}
                        onChange={(e) => handleCambio('sexo', e.target.value)}
                        label="Sexo"
                        sx={{
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                        }}
                      >
                        <MenuItem value="Masculino">Masculino</MenuItem>
                        <MenuItem value="Femenino">Femenino</MenuItem>
                        <MenuItem value="Otro">Otro</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <CampoCard label="Sexo" valor={legajo.sexo} icon={WcIcon} color="#667eea" />
                  )}
                </Grid>

                {/* Estado Civil */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <FormControl fullWidth>
                      <InputLabel>Estado Civil</InputLabel>
                      <Select
                        value={datosEditables.estado_civil}
                        onChange={(e) => handleCambio('estado_civil', e.target.value)}
                        label="Estado Civil"
                        sx={{
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                        }}
                      >
                        <MenuItem value="Soltero">Soltero</MenuItem>
                        <MenuItem value="Casado">Casado</MenuItem>
                        <MenuItem value="Divorciado">Divorciado</MenuItem>
                        <MenuItem value="Viudo">Viudo</MenuItem>
                        <MenuItem value="Unión Convivencial">Unión Convivencial</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <CampoCard label="Estado Civil" valor={legajo.estado_civil} icon={FavoriteIcon} color="#667eea" />
                  )}
                </Grid>

                {/* Nacionalidad */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Nacionalidad"
                      value={datosEditables.nacionalidad}
                      onChange={(e) => handleCambio('nacionalidad', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <PublicIcon sx={{ mr: 1, color: '#667eea' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Nacionalidad" valor={legajo.nacionalidad} icon={PublicIcon} color="#667eea" />
                  )}
                </Grid>
              </Grid>
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

              <Grid container spacing={2.5}>
                {/* Domicilio */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Domicilio"
                      value={datosEditables.domicilio}
                      onChange={(e) => handleCambio('domicilio', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <HomeIcon sx={{ mr: 1, color: '#43a047' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#43a047' },
                          '&.Mui-focused fieldset': { borderColor: '#43a047' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Domicilio" valor={legajo.domicilio} icon={HomeIcon} color="#43a047" />
                  )}
                </Grid>

                {/* Localidad */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Localidad"
                      value={datosEditables.localidad}
                      onChange={(e) => handleCambio('localidad', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <LocationOnIcon sx={{ mr: 1, color: '#43a047' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#43a047' },
                          '&.Mui-focused fieldset': { borderColor: '#43a047' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Localidad" valor={legajo.localidad} icon={LocationOnIcon} color="#43a047" />
                  )}
                </Grid>

                {/* Provincia */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Provincia"
                      value={datosEditables.provincia}
                      onChange={(e) => handleCambio('provincia', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <PublicIcon sx={{ mr: 1, color: '#43a047' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#43a047' },
                          '&.Mui-focused fieldset': { borderColor: '#43a047' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Provincia" valor={legajo.provincia} icon={PublicIcon} color="#43a047" />
                  )}
                </Grid>

                {/* Código Postal */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Código Postal"
                      value={datosEditables.codigo_postal}
                      onChange={(e) => handleCambio('codigo_postal', e.target.value)}
                      variant="outlined"
                      inputProps={{ maxLength: 8 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#43a047' },
                          '&.Mui-focused fieldset': { borderColor: '#43a047' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Código Postal" valor={legajo.codigo_postal} icon={LocationOnIcon} color="#43a047" />
                  )}
                </Grid>
              </Grid>
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

              <Grid container spacing={2.5}>
                {/* Teléfono */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={datosEditables.telefono_contacto}
                      onChange={(e) => handleCambio('telefono_contacto', e.target.value)}
                      variant="outlined"
                      placeholder="+54 11 1234-5678"
                      InputProps={{
                        startAdornment: (
                          <PhoneIcon sx={{ mr: 1, color: '#fb8c00' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#fb8c00' },
                          '&.Mui-focused fieldset': { borderColor: '#fb8c00' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Teléfono" valor={legajo.telefono_contacto} icon={PhoneIcon} color="#fb8c00" />
                  )}
                </Grid>

                {/* Contacto Emergencia */}
                <Grid item xs={12}>
                  {modoEdicion ? (
                    <TextField
                      fullWidth
                      label="Contacto de Emergencia"
                      value={datosEditables.contacto_emergencia}
                      onChange={(e) => handleCambio('contacto_emergencia', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <ContactPhoneIcon sx={{ mr: 1, color: '#fb8c00' }} />
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#fb8c00' },
                          '&.Mui-focused fieldset': { borderColor: '#fb8c00' }
                        }
                      }}
                    />
                  ) : (
                    <CampoCard label="Contacto Emergencia" valor={legajo.contacto_emergencia} icon={ContactPhoneIcon} color="#fb8c00" />
                  )}
                </Grid>
              </Grid>
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

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <CampoCard label="Fecha Ingreso" valor={formatFecha(legajo.fecha_ingreso)} icon={CalendarMonthIcon} color="#5c6bc0" />
                </Grid>
                <Grid item xs={12}>
                  <CampoCard label="Centro de Costos" valor={legajo.centro_costos} icon={WorkIcon} color="#5c6bc0" />
                </Grid>
                <Grid item xs={12}>
                  <CampoCard label="Tarea" valor={legajo.tarea_desempenada} icon={AssignmentIcon} color="#5c6bc0" />
                </Grid>
                <Grid item xs={12}>
                  <CampoCard label="Banco" valor={legajo.banco_destino} icon={AccountBalanceIcon} color="#5c6bc0" />
                </Grid>
                <Grid item xs={12}>
                  <CampoCard label="Cuenta Bancaria" valor={legajo.cuenta_bancaria} icon={AccountBalanceIcon} color="#5c6bc0" />
                </Grid>
              </Grid>
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
