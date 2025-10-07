import React, { useState, useEffect } from 'react';
import { getUser } from '../utils/auth';
import { apiRequest } from '../utils/api';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  AlertTitle,
  LinearProgress,
  Button,
  Divider,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Upload as UploadIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({});
  const [perfil, setPerfil] = useState({});
  const [alertas, setAlertas] = useState([]);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch estadísticas
      const statsData = await apiRequest('/api/dashboard/estadisticas');
      
      // Fetch perfil
      const perfilData = await apiRequest('/api/dashboard/perfil');
      
      // Fetch alertas
      const alertasData = await apiRequest('/api/dashboard/alertas');
      
      setEstadisticas(statsData);
      setPerfil(perfilData);
      setAlertas(alertasData);
      setError(null);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getSeverityForAlert = (tipo) => {
    switch (tipo) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getRoleDisplayName = (rol) => {
    switch (rol) {
      case 'superadmin': return 'Super Administrador';
      case 'admin_rrhh': return 'Admin RRHH';
      case 'empleado': return 'Empleado';
      default: return rol;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Cargando Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            <RefreshIcon sx={{ mr: 1 }} />
            Reintentar
          </Button>
        }>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard - Bienvenido, {user?.nombre || 'Usuario'}
        </Typography>
        <IconButton onClick={fetchDashboardData} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Perfil del Usuario */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardHeader 
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <PersonIcon />
                </Avatar>
              }
              title="Mi Perfil"
              subtitle={getRoleDisplayName(user?.rol)}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {perfil.nombre} {perfil.apellido}
              </Typography>
              {user?.rol === 'empleado' && perfil.empresa_nombre && (
                <Chip 
                  icon={<BusinessIcon />} 
                  label={perfil.empresa_nombre}
                  color="primary"
                  size="small"
                  sx={{ mb: 2 }}
                />
              )}
              <Typography variant="body2" color="text.secondary">
                {perfil.correo || user?.correo}
              </Typography>
              {user?.rol === 'empleado' && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/legajo')}
                >
                  Ver Mi Legajo
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estadísticas Rápidas */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {estadisticas.basicas?.usuarios_activos || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usuarios Activos
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <BusinessIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {estadisticas.basicas?.empresas_activas || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empresas Activas
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <ReceiptIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {estadisticas.basicas?.periodos_disponibles || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Períodos de Recibos
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TimelineIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {estadisticas.basicas?.total_legajos || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Legajos
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Alertas y Notificaciones */}
        {alertas.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Alertas y Notificaciones" />
              <CardContent sx={{ pt: 0 }}>
                <Grid container spacing={2}>
                  {alertas.map((alerta, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Alert 
                        severity={getSeverityForAlert(alerta.tipo)}
                        action={
                          alerta.accion && (
                            <Button 
                              color="inherit" 
                              size="small"
                              onClick={() => navigate(alerta.accion)}
                            >
                              Ver
                            </Button>
                          )
                        }
                      >
                        <AlertTitle>{alerta.titulo}</AlertTitle>
                        {alerta.descripcion}
                      </Alert>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Estadísticas específicas para empleados */}
        {user?.rol === 'empleado' && estadisticas.empleado && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Mis Recibos" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <ReceiptIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Total de Recibos"
                      secondary={estadisticas.empleado.total_recibos || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Recibos Firmados"
                      secondary={estadisticas.empleado.recibos_firmados || 0}
                    />
                  </ListItem>
                  {estadisticas.empleado.ultimo_periodo && (
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon color="info" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Último Período"
                        secondary={estadisticas.empleado.ultimo_periodo}
                      />
                    </ListItem>
                  )}
                </List>
                <Button 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/recibos')}
                >
                  Ver Mis Recibos
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Estadísticas específicas para administradores */}
        {(user?.rol === 'admin_rrhh' || user?.rol === 'superadmin') && estadisticas.admin && (
          <>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Estadísticas de Administración" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <UploadIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Importaciones Hoy"
                        secondary={estadisticas.admin.importaciones_hoy || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ReceiptIcon color="info" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Recibos Esta Semana"
                        secondary={estadisticas.admin.recibos_semana || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonAddIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Usuarios Nuevos (Mes)"
                        secondary={estadisticas.admin.usuarios_nuevos_mes || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Errores Esta Semana"
                        secondary={estadisticas.admin.errores_semana || 0}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recibos por Período */}
            {estadisticas.admin.recibos_por_periodo && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Recibos por Período" />
                  <CardContent>
                    <List dense>
                      {estadisticas.admin.recibos_por_periodo.map((periodo, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={periodo.PeriodoLiquidacion}
                            secondary={`${periodo.cantidad} recibos - ${periodo.firmados} firmados`}
                          />
                          <Box sx={{ minWidth: 50 }}>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round((periodo.firmados / periodo.cantidad) * 100)}%
                            </Typography>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/recibos')}
                    >
                      Gestionar Recibos
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </>
        )}

        {/* Actividad Reciente */}
        {estadisticas.actividad_reciente && estadisticas.actividad_reciente.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Actividad Reciente" />
              <CardContent>
                <List>
                  {estadisticas.actividad_reciente.map((actividad, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUpIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={actividad.descripcion}
                          secondary={`${actividad.detalle} - ${new Date(actividad.fecha).toLocaleString()}`}
                        />
                      </ListItem>
                      {index < estadisticas.actividad_reciente.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Métricas de Rendimiento del Sistema */}
        {(user?.rol === 'admin_rrhh' || user?.rol === 'superadmin') && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Rendimiento del Sistema" />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Recibos Firmados</Typography>
                    <Typography variant="body2">
                      {estadisticas.admin?.porcentaje_firmados || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={estadisticas.admin?.porcentaje_firmados || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Usuarios Activos</Typography>
                    <Typography variant="body2">
                      {estadisticas.admin?.porcentaje_usuarios_activos || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={estadisticas.admin?.porcentaje_usuarios_activos || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="secondary"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Legajos Completos</Typography>
                    <Typography variant="body2">
                      {estadisticas.admin?.porcentaje_legajos_completos || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={estadisticas.admin?.porcentaje_legajos_completos || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="success"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Estados de Usuarios por Rol */}
        {(user?.rol === 'admin_rrhh' || user?.rol === 'superadmin') && estadisticas.admin?.usuarios_por_rol && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Distribución por Roles" />
              <CardContent>
                {estadisticas.admin.usuarios_por_rol.map((rolData, index) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label={getRoleDisplayName(rolData.rol)}
                      color={rolData.rol === 'superadmin' ? 'error' : rolData.rol === 'admin_rrhh' ? 'warning' : 'default'}
                      size="small"
                      sx={{ minWidth: 140 }}
                    />
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(rolData.cantidad / estadisticas.basicas.usuarios_activos) * 100}
                        sx={{ flexGrow: 1, height: 6 }}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {rolData.cantidad}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Tendencias y Comparativas */}
        {estadisticas.tendencias && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Tendencias del Mes" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <TrendingUpIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        +{estadisticas.tendencias.nuevos_usuarios || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nuevos Usuarios
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        vs mes anterior: +{estadisticas.tendencias.crecimiento_usuarios || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <ReceiptIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {estadisticas.tendencias.recibos_procesados || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Recibos Procesados
                      </Typography>
                      <Typography variant="caption" color="primary.main">
                        vs mes anterior: +{estadisticas.tendencias.crecimiento_recibos || 0}%
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {estadisticas.tendencias.firmas_completadas || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Firmas Completadas
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        Tasa: {estadisticas.tendencias.tasa_firmas || 0}%
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <ErrorIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h5" fontWeight="bold" color="error.main">
                        {estadisticas.tendencias.errores_resueltos || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Errores Resueltos
                      </Typography>
                      <Typography variant="caption" color="error.main">
                        Pendientes: {estadisticas.tendencias.errores_pendientes || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}