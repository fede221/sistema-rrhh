import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import usePermisos from '../../hooks/usePermisos';
import { apiRequest } from '../api';

const MiEquipo = () => {
  const [empleados, setEmpleados] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [recibosEmpleado, setRecibosEmpleado] = useState([]);
  const [modalRecibos, setModalRecibos] = useState(false);
  const { tienePermiso, esSuperAdmin, loading: permisosLoading, permisos, rol } = usePermisos();

  // Verificar si tiene permisos para ver el equipo
  const puedeVerEquipo = esSuperAdmin() || 
                        tienePermiso('usuarios', 'ver_equipo') || 
                        tienePermiso('legajos', 'ver_equipo') || 
                        tienePermiso('recibos', 'ver_equipo');

  useEffect(() => {
    if (!permisosLoading && puedeVerEquipo) {
      fetchEmpleados();
      fetchEstadisticas();
    }
  }, [puedeVerEquipo, permisosLoading]);

  const fetchEmpleados = async () => {
    try {
      const data = await apiRequest('/referente/empleados');

      if (data && data.data) {
        setEmpleados(data.data);
      } else {
        setError('Error al cargar empleados');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar empleados');
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const data = await apiRequest('/referente/estadisticas');

      if (data && data.data) {
        setEstadisticas(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const verRecibosEmpleado = async (empleado) => {
    try {
      setEmpleadoSeleccionado(empleado);
      const data = await apiRequest(`/api/referente/recibos?empleadoId=${empleado.id}`);

      if (data && data.data) {
        setRecibosEmpleado(data.data);
        setModalRecibos(true);
      } else {
        setError('Error al cargar recibos del empleado');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar recibos del empleado');
    }
  };

  const formatNumber = (number) => {
    if (number === null || number === undefined) return '0,00';
    return parseFloat(number).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Verificar que sea una cadena antes de usar split
    if (typeof dateString !== 'string') {
      console.warn('formatDate recibió un valor no string:', dateString);
      return 'N/A';
    }
    
    // Evitar problemas de timezone usando split en lugar de new Date()
    const fechaParts = dateString.split('-');
    if (fechaParts.length === 3) {
      const [year, month, day] = fechaParts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    return dateString;
  };

  if (loading || permisosLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando información del equipo...</Typography>
      </Box>
    );
  }

  // Verificar permisos antes de mostrar el contenido
  if (!puedeVerEquipo) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para ver la información del equipo.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: '#1976d2',
          mb: 3
        }}
      >
        Mi Equipo de Trabajo
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas del equipo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(25, 118, 210, 0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  borderRadius: '12px',
                  p: 1.5,
                  mr: 2
                }}>
                  <PeopleIcon color="primary" sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {estadisticas.total_empleados || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Empleados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(76, 175, 80, 0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: '12px',
                  p: 1.5,
                  mr: 2
                }}>
                  <ReceiptIcon color="success" sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {estadisticas.empleados_con_recibos || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Con Recibos ({estadisticas.porcentaje_con_recibos || 0}%)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255, 152, 0, 0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  borderRadius: '12px',
                  p: 1.5,
                  mr: 2
                }}>
                  <AssignmentIcon color="warning" sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {estadisticas.empleados_con_firmas || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Con Firmas ({estadisticas.porcentaje_con_firmas || 0}%)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(33, 150, 243, 0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  borderRadius: '12px',
                  p: 1.5,
                  mr: 2
                }}>
                  <ReceiptIcon color="info" sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {estadisticas.periodos_activos || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Períodos Activos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de empleados */}
      <Box sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#1976d2'
            }}
          >
            Empleados a mi cargo ({empleados.length})
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: '#1976d2',
                '& th': {
                  borderBottom: 'none',
                  color: 'white !important',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  py: 2
                }
              }}>
                <TableCell>👤 Empleado</TableCell>
                <TableCell>🆔 DNI</TableCell>
                <TableCell>📅 Fecha Ingreso</TableCell>
                <TableCell align="center">✅ Estado</TableCell>
                <TableCell align="center">📄 Recibos</TableCell>
                <TableCell align="center">📊 Último Período</TableCell>
                <TableCell align="center">⚡ Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleados.map((empleado) => (
                <TableRow 
                  key={empleado.id}
                  sx={{ 
                    '&:nth-of-type(even)': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      transform: 'scale(1.001)',
                      transition: 'all 0.2s ease',
                    }
                  }}
                >
                  <TableCell sx={{ borderBottom: '1px solid #f0f0f0', padding: '12px' }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary">
                      {empleado.nombre} {empleado.apellido}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f0f0f0', padding: '12px' }}>
                    <Typography variant="body2">
                      {empleado.dni}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #f0f0f0', padding: '12px' }}>
                    <Typography variant="body2">
                      {formatDate(empleado.fecha_ingreso)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid #f0f0f0', padding: '12px' }}>
                    <Chip
                      label={empleado.activo ? 'Activo' : 'Inactivo'}
                      color={empleado.activo ? 'success' : 'error'}
                      size="small"
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid #f0f0f0', padding: '12px' }}>
                    <Chip
                      label={empleado.total_recibos}
                      color="info"
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid #f0f0f0', padding: '12px' }}>
                    <Typography variant="body2" color="text.secondary">
                      {empleado.ultimo_periodo || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid #f0f0f0', padding: '12px' }}>
                    <Tooltip title={empleado.total_recibos === 0 ? 'No hay recibos disponibles' : 'Ver recibos del empleado'}>
                      <span>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => verRecibosEmpleado(empleado)}
                          disabled={empleado.total_recibos === 0}
                          sx={{
                            bgcolor: empleado.total_recibos > 0 ? 'primary.50' : 'grey.200',
                            '&:hover': { 
                              bgcolor: empleado.total_recibos > 0 ? 'primary.100' : 'grey.200' 
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {empleados.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            borderTop: '1px solid #e2e8f0'
          }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No hay empleados a tu cargo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Los empleados aparecerán aquí cuando sean asignados a tu supervisión
            </Typography>
          </Box>
        )}
      </Box>

      {/* Modal de recibos del empleado */}
      <Dialog open={modalRecibos} onClose={() => setModalRecibos(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Recibos de {empleadoSeleccionado?.nombre} {empleadoSeleccionado?.apellido}
        </DialogTitle>
        <DialogContent>
          {recibosEmpleado.length > 0 ? (
            <Box>
              {Object.entries(
                recibosEmpleado.reduce((acc, recibo) => {
                  if (!acc[recibo.periodo]) acc[recibo.periodo] = [];
                  acc[recibo.periodo].push(recibo);
                  return acc;
                }, {})
              ).map(([periodo, recibos]) => (
                <Accordion key={periodo}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      Período {periodo} 
                      <Chip 
                        label={recibos[0]?.tipo_liquidacion || 'N/A'} 
                        size="small" 
                        sx={{ ml: 2 }}
                      />
                      {recibos[0]?.fecha_firma && (
                        <Chip 
                          label="Firmado" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Código</TableCell>
                            <TableCell>Concepto</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Importe</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recibos.map((recibo, index) => (
                            <TableRow key={index}>
                              <TableCell>{recibo.codigo}</TableCell>
                              <TableCell>{recibo.concepto}</TableCell>
                              <TableCell align="right">{recibo.cantidad}</TableCell>
                              <TableCell align="right">
                                <Typography 
                                  color={recibo.importe >= 0 ? 'success.main' : 'error.main'}
                                >
                                  ${formatNumber(recibo.importe)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Typography>No hay recibos disponibles para este empleado.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalRecibos(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MiEquipo;