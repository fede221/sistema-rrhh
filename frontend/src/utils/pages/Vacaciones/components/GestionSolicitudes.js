import { API_BASE_URL } from '../../../../config';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import { Check, Close, Visibility, Refresh } from '@mui/icons-material';

const getEstadoColor = (estado) => {
  switch (estado) {
    case 'aprobado': return 'success';
    case 'rechazado': return 'error';
    case 'pendiente': return 'warning';
    default: return 'default';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  // Verificar que sea una cadena antes de usarla
  if (typeof dateString !== 'string') {
    console.warn('formatDate recibió un valor no string:', dateString);
    return 'N/A';
  }
  
  return new Date(dateString).toLocaleDateString('es-ES');
};

const GestionSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [comentarios, setComentarios] = useState('');
  const [procesando, setProcesando] = useState(false);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/vacaciones/todas-solicitudes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar solicitudes');
      
      const data = await response.json();
      setSolicitudes(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const abrirDialog = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setComentarios(solicitud.comentarios || '');
    setDialogOpen(true);
  };

  const cerrarDialog = () => {
    setDialogOpen(false);
    setSolicitudSeleccionada(null);
    setComentarios('');
  };

  const manejarRespuesta = async (estado) => {
    if (!solicitudSeleccionada) return;

    try {
      setProcesando(true);
      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/vacaciones/responder/${solicitudSeleccionada.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado,
          comentarios,
          aprobado_por: userData.id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la respuesta');
      }

      // Recargar solicitudes
      await cargarSolicitudes();
      cerrarDialog();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const solicitudesProcesadas = solicitudes.filter(s => s.estado !== 'pendiente');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Gestión de Solicitudes de Vacaciones
        </Typography>
        <Tooltip title="Actualizar">
          <IconButton onClick={cargarSolicitudes}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Solicitudes Pendientes */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="warning.main">
            Solicitudes Pendientes ({solicitudesPendientes.length})
          </Typography>

          {solicitudesPendientes.length === 0 ? (
            <Alert severity="info">
              No hay solicitudes pendientes.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Empresa</TableCell>
                    <TableCell>Fecha Solicitud</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell align="center">Días</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudesPendientes.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell>
                        <Typography variant="body2">
                          <strong>{solicitud.nombre_usuario} {solicitud.apellido_usuario}</strong>
                          <br />
                          DNI: {solicitud.dni}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {solicitud.nombre_empresa || 'Sin empresa'}
                      </TableCell>
                      <TableCell>
                        {formatDate(solicitud.fecha_solicitud)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          <strong>Desde:</strong> {formatDate(solicitud.fecha_inicio)}
                          <br />
                          <strong>Hasta:</strong> {formatDate(solicitud.fecha_fin)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" component="span">
                          {solicitud.dias_solicitados}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label="Pendiente" 
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalles">
                          <IconButton 
                            size="small" 
                            onClick={() => abrirDialog(solicitud)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Solicitudes Procesadas */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Solicitudes Procesadas ({solicitudesProcesadas.length})
          </Typography>

          {solicitudesProcesadas.length === 0 ? (
            <Alert severity="info">
              No hay solicitudes procesadas.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell align="center">Días</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell>Fecha Respuesta</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudesProcesadas.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {solicitud.nombre_usuario} {solicitud.apellido_usuario}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(solicitud.fecha_inicio)} - {formatDate(solicitud.fecha_fin)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {solicitud.dias_solicitados}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)} 
                          color={getEstadoColor(solicitud.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(solicitud.fecha_respuesta)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      <Dialog open={dialogOpen} onClose={cerrarDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Solicitud de Vacaciones - {solicitudSeleccionada?.nombre_usuario} {solicitudSeleccionada?.apellido_usuario}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Empleado"
                value={`${solicitudSeleccionada?.nombre_usuario} ${solicitudSeleccionada?.apellido_usuario}`}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="DNI"
                value={solicitudSeleccionada?.dni || ''}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha Inicio"
                value={solicitudSeleccionada ? formatDate(solicitudSeleccionada.fecha_inicio) : ''}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha Fin"
                value={solicitudSeleccionada ? formatDate(solicitudSeleccionada.fecha_fin) : ''}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Días Solicitados"
                value={solicitudSeleccionada?.dias_solicitados || ''}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha de Solicitud"
                value={solicitudSeleccionada ? formatDate(solicitudSeleccionada.fecha_solicitud) : ''}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Comentarios del Empleado"
                value={solicitudSeleccionada?.comentarios || 'Sin comentarios'}
                fullWidth
                multiline
                rows={2}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Respuesta del Administrador"
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Agrega comentarios sobre tu decisión..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={() => manejarRespuesta('rechazado')}
            color="error"
            variant="outlined"
            startIcon={<Close />}
            disabled={procesando}
          >
            Rechazar
          </Button>
          <Button 
            onClick={() => manejarRespuesta('aprobado')}
            color="success"
            variant="contained"
            startIcon={<Check />}
            disabled={procesando}
          >
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionSolicitudes;
