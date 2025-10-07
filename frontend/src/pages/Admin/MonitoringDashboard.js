import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { getToken } from '../../utils/auth';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';

const MonitoringDashboard = () => {
  const [backendHealth, setBackendHealth] = useState(null);
  const [frontendHealth, setFrontendHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Verificar estado del backend
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendHealth({
          status: 'online',
          ...data
        });
      } else {
        throw new Error('Backend no responde');
      }
    } catch (error) {
      setBackendHealth({
        status: 'offline',
        error: error.message
      });
    }
  };

  // Verificar estado del frontend (básico)
  const checkFrontendHealth = () => {
    const performanceData = {
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      timing: performance.timing ? {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      } : null,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };

    setFrontendHealth({
      status: 'online',
      uptime: (Date.now() - window.performance.timeOrigin) / 1000,
      timestamp: new Date().toISOString(),
      performance: performanceData,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  // Función para actualizar todos los estados
  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      checkBackendHealth(),
      checkFrontendHealth()
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  };

  // Efecto para carga inicial y auto-refresh
  useEffect(() => {
    refreshAll();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(refreshAll, 30000); // Actualizar cada 30 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Función para formatear el uptime
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Función para formatear bytes
  const formatBytes = (bytes) => {
    return `${Math.round(bytes)} MB`;
  };

  // Componente de estado
  const StatusChip = ({ status, label }) => {
    const getColor = () => {
      switch (status) {
        case 'online': return 'success';
        case 'warning': return 'warning';
        case 'offline': return 'error';
        default: return 'default';
      }
    };

    const getIcon = () => {
      switch (status) {
        case 'online': return <CheckIcon />;
        case 'warning': return <WarningIcon />;
        case 'offline': return <ErrorIcon />;
        default: return null;
      }
    };

    return (
      <Chip
        icon={getIcon()}
        label={label}
        color={getColor()}
        variant="filled"
        size="medium"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <ComputerIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Dashboard de Monitoreo
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshAll}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant={autoRefresh ? "contained" : "outlined"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            color={autoRefresh ? "success" : "default"}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </Box>
      </Box>

      {lastUpdate && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Última actualización: {lastUpdate.toLocaleString()}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Estado del Backend */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Backend
                </Typography>
                <StatusChip 
                  status={backendHealth?.status} 
                  label={backendHealth?.status?.toUpperCase() || 'UNKNOWN'} 
                />
              </Box>

              {backendHealth?.status === 'online' ? (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Uptime: {formatUptime(backendHealth.uptime)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    PID: {backendHealth.pid}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Base de datos: <Chip label={backendHealth.database} color="success" size="small" />
                  </Typography>

                  {backendHealth.memory && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        <MemoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Memoria
                      </Typography>
                      <Typography variant="body2">
                        RSS: {formatBytes(backendHealth.memory.rss / 1024 / 1024)}
                      </Typography>
                      <Typography variant="body2">
                        Heap Used: {formatBytes(backendHealth.memory.heapUsed / 1024 / 1024)}
                      </Typography>
                      <Typography variant="body2">
                        Heap Total: {formatBytes(backendHealth.memory.heapTotal / 1024 / 1024)}
                      </Typography>
                    </>
                  )}
                </>
              ) : (
                <Alert severity="error">
                  Error: {backendHealth?.error || 'Backend no disponible'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estado del Frontend */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Frontend
                </Typography>
                <StatusChip 
                  status={frontendHealth?.status} 
                  label={frontendHealth?.status?.toUpperCase() || 'UNKNOWN'} 
                />
              </Box>

              {frontendHealth?.status === 'online' ? (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Uptime: {formatUptime(frontendHealth.uptime)}
                  </Typography>

                  {frontendHealth.performance?.memory && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        <MemoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Memoria JS
                      </Typography>
                      <Typography variant="body2">
                        Usada: {frontendHealth.performance.memory.used} MB
                      </Typography>
                      <Typography variant="body2">
                        Total: {frontendHealth.performance.memory.total} MB
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(frontendHealth.performance.memory.used / frontendHealth.performance.memory.total) * 100}
                        sx={{ mt: 1 }}
                      />
                    </>
                  )}

                  {frontendHealth.performance?.timing && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Performance
                      </Typography>
                      <Typography variant="body2">
                        Tiempo de carga: {frontendHealth.performance.timing.loadTime}ms
                      </Typography>
                      <Typography variant="body2">
                        DOM listo: {frontendHealth.performance.timing.domReady}ms
                      </Typography>
                    </>
                  )}

                  {frontendHealth.performance?.connection && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Conexión
                      </Typography>
                      <Typography variant="body2">
                        Tipo: {frontendHealth.performance.connection.effectiveType}
                      </Typography>
                      <Typography variant="body2">
                        Velocidad: {frontendHealth.performance.connection.downlink} Mbps
                      </Typography>
                      <Typography variant="body2">
                        RTT: {frontendHealth.performance.connection.rtt}ms
                      </Typography>
                    </>
                  )}
                </>
              ) : (
                <Alert severity="error">
                  Frontend no disponible
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Tabla de sistemas */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumen de Estado
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sistema</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Memoria</TableCell>
                    <TableCell>Última actualización</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Backend</TableCell>
                    <TableCell>
                      <StatusChip status={backendHealth?.status} label={backendHealth?.status || 'Unknown'} />
                    </TableCell>
                    <TableCell>{backendHealth?.uptime ? formatUptime(backendHealth.uptime) : 'N/A'}</TableCell>
                    <TableCell>
                      {backendHealth?.memory ? 
                        formatBytes(backendHealth.memory.rss / 1024 / 1024) : 'N/A'}
                    </TableCell>
                    <TableCell>{backendHealth?.timestamp ? new Date(backendHealth.timestamp).toLocaleString() : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Frontend</TableCell>
                    <TableCell>
                      <StatusChip status={frontendHealth?.status} label={frontendHealth?.status || 'Unknown'} />
                    </TableCell>
                    <TableCell>{frontendHealth?.uptime ? formatUptime(frontendHealth.uptime) : 'N/A'}</TableCell>
                    <TableCell>
                      {frontendHealth?.performance?.memory ? 
                        `${frontendHealth.performance.memory.used} MB` : 'N/A'}
                    </TableCell>
                    <TableCell>{frontendHealth?.timestamp ? new Date(frontendHealth.timestamp).toLocaleString() : 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonitoringDashboard;