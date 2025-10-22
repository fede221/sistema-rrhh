import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Grid,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  RestoreOutlined as RestoreIcon
} from '@mui/icons-material';
import { apiRequest } from '../api';

const GestionPermisos = () => {
  // HOOKS primero
  const [permisos, setPermisos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, rol: '', action: '' });
  const [permisoEditarLegajoPropio, setPermisoEditarLegajoPropio] = useState(true);

  // Etiquetas legibles para los roles
  const rolesLabels = {
    admin_rrhh: 'Administrador RRHH',
    empleado: 'Empleado',
    referente: 'Referente',
    // Agrega aquí otros roles si existen
  };

  // Obtener permisos desde la API
  const fetchPermisos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/permisos');
      if (data && data.success && data.data) {
        setPermisos(data.data);
      } else {
        setError('No se pudieron obtener los permisos');
      }
    } catch (err) {
      console.error('Error fetching permisos:', err);
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar un permiso individual
  const updatePermiso = async (id, value) => {
    setUpdating(true);
    setError('');
    try {
      const data = await apiRequest(`/api/permisos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: value }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (data.success) {
        fetchPermisos();
      } else {
        setError(data.message || 'Error al actualizar permiso');
      }
    } catch (err) {
      setError('Error de conexión al actualizar permiso');
    } finally {
      setUpdating(false);
    }
  };

  // Alternar permiso especial para editar legajo propio
  const toggleEditarLegajoPropio = (checked) => {
    setPermisoEditarLegajoPropio(checked);
    // Aquí podrías agregar lógica para guardar este permiso en backend si es necesario
  };

  // Nombres legibles para módulos y permisos
  const modulosLabels = {
    dashboard: 'Panel de Control',
    usuarios: 'Gestión de Usuarios',
    recibos: 'Gestión de Recibos',
    vacaciones: 'Gestión de Vacaciones',
    legajos: 'Gestión de Legajos',
    legajo: 'Mi Legajo'
  };

  const permisosLabels = {
    ver: 'Ver',
    crear: 'Crear',
    editar: 'Editar',
    eliminar: 'Eliminar',
    estadisticas: 'Ver Estadísticas',
    importar: 'Importar Archivos',
    imprimir: 'Imprimir',
    imprimir_propios: 'Imprimir Propios'
  };

  const resetPermisosDefecto = async (rol) => {
    try {
      setUpdating(true);
      
      const data = await apiRequest(`/api/permisos/reset/${rol}`, {
        method: 'POST'
      });

      if (data.success) {
        setSuccess(`Permisos restablecidos para ${rolesLabels[rol]}`);
        fetchPermisos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error al restablecer permisos');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('Error de conexión al restablecer permisos');
      console.error('Error:', err);
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdating(false);
      setConfirmDialog({ open: false, rol: '', action: '' });
    }
  };

  const handleTogglePermiso = (id, currentValue) => {
    updatePermiso(id, !currentValue);
  };

  const countPermisosActivos = (rolPermisos) => {
    let total = 0;
    let activos = 0;
    
    Object.values(rolPermisos).forEach(modulo => {
      modulo.forEach(permiso => {
        total++;
        if (permiso.activo) activos++;
      });
    });
    
    return { activos, total };
  };

  useEffect(() => {
    fetchPermisos();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Cargando permisos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#fff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4, mt: 2 }}>
        <SecurityIcon sx={{ fontSize: 38, color: '#00bcd4', mr: 1 }} />
        <Typography variant="h4" fontWeight={700} sx={{ 
          background: 'linear-gradient(90deg, #00bcd4 30%, #2196f3 90%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          Gestión de Permisos
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, mx: 3 }}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, mx: 3 }}>{success}</Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', px: 2 }}>
        <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: 1400 }}>
          {Object.entries(permisos).map(([rol, rolPermisos]) => {
          const { activos, total } = countPermisosActivos(rolPermisos);
          return (
            <Grid item xs={12} sm={6} md={4} key={rol} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: '0 4px 24px 0 rgba(33,150,243,0.08)',
                  background: '#fff',
                  minHeight: 340,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  px: 2,
                  pt: 2,
                  pb: 3,
                  width: 370,
                  maxWidth: '90vw',
                  border: '1px solid #e3f2fd',
                }}
              >
                <CardContent sx={{ flex: 1, p: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1, color: '#1976d2', fontWeight: 700 }}>
                      {rolesLabels[rol]}
                    </Typography>
                    <Chip 
                      label={`${activos}/${total}`} 
                      sx={{
                        background: activos === total ? '#388e3c' : '#ff9800',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 15,
                        px: 1.5,
                        borderRadius: 2,
                        mr: 1,
                      }}
                    />
                    <SettingsIcon sx={{ color: '#90caf9', fontSize: 26 }} />
                  </Box>
                  {Object.entries(rolPermisos).map(([modulo, permisosList]) => (
                    <Accordion key={modulo} sx={{ mb: 1, borderRadius: 2, bgcolor: '#f8f9fa', boxShadow: '0 2px 8px rgba(25,118,210,0.04)', border: '1px solid #e3f2fd' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#1976d2' }} />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <SettingsIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                          <Typography sx={{ flexGrow: 1, fontWeight: 600, color: '#1976d2' }}>
                            {modulosLabels[modulo] || modulo}
                          </Typography>
                          <Chip 
                            label={`${permisosList.filter(p => p.activo).length}/${permisosList.length}`}
                            size="small"
                            sx={{
                              background: permisosList.every(p => p.activo) ? '#388e3c' : '#bdbdbd',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 13,
                              px: 1,
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 1, pb: 0.5, bgcolor: '#fff' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {permisosList.map((permisoObj) => (
                            <FormControlLabel
                              key={permisoObj.id}
                              control={
                                <Switch
                                  checked={permisoObj.activo}
                                  onChange={() => handleTogglePermiso(permisoObj.id, permisoObj.activo)}
                                  disabled={updating}
                                  color={permisoObj.activo ? 'primary' : 'default'}
                                  sx={{
                                    '& .MuiSwitch-thumb': {
                                      bgcolor: permisoObj.activo ? 'primary.main' : 'grey.400',
                                    },
                                    '& .MuiSwitch-track': {
                                      bgcolor: permisoObj.activo ? 'primary.100' : 'grey.200',
                                    }
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontWeight: 500, color: permisoObj.activo ? 'primary.main' : 'grey.600' }}>
                                    {permisosLabels[permisoObj.permiso] || permisoObj.permiso}
                                  </Typography>
                                  {permisoObj.activo && (
                                    <Chip label="Activo" color="success" size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                                  )}
                                </Box>
                              }
                              sx={{ 
                                display: 'block',
                                mb: 1,
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '0.95rem',
                                }
                              }}
                            />
                          ))}
                          {/* Configuración especial para admin_rrhh en módulo legajos */}
                          {rol === 'admin_rrhh' && modulo === 'legajos' && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                                Configuración Especial
                              </Typography>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={permisoEditarLegajoPropio}
                                    onChange={(e) => toggleEditarLegajoPropio(e.target.checked)}
                                    disabled={updating}
                                    color="primary"
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      Permitir editar su propio legajo
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                      {permisoEditarLegajoPropio 
                                        ? 'Los admin RRHH pueden editar campos básicos de su legajo' 
                                        : 'Los admin RRHH no pueden editar su legajo (solo lectura)'
                                      }
                                    </Typography>
                                  </Box>
                                }
                                sx={{ 
                                  display: 'block',
                                  alignItems: 'flex-start',
                                  '& .MuiFormControlLabel-label': {
                                    fontSize: '0.9rem',
                                  }
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
    
    {/* Dialog de confirmación */}
    <Dialog
      open={confirmDialog.open}
      onClose={() => setConfirmDialog({ open: false, rol: '', action: '' })}
    >
      <DialogTitle>Confirmar Acción</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Está seguro de que desea restablecer todos los permisos por defecto para el rol{' '}
          <strong>{rolesLabels[confirmDialog.rol]}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Esta acción activará todos los permisos del rol seleccionado.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setConfirmDialog({ open: false, rol: '', action: '' })}
          disabled={updating}
        >
          Cancelar
        </Button>
        <Button 
          onClick={() => resetPermisosDefecto(confirmDialog.rol)}
          variant="contained"
          disabled={updating}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
);
};

export default GestionPermisos;