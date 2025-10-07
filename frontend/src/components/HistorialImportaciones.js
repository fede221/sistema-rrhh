import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Pagination,
  Card,
  CardContent
} from '@mui/material';
import { getToken } from '../utils/auth';

const HistorialImportaciones = ({ open, onClose }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    usuario: '',
    periodo: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'error', label: 'Con Error' },
    { value: 'en_proceso', label: 'En Proceso' }
  ];

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completada': return 'success';
      case 'cancelada': return 'warning';
      case 'error': return 'error';
      case 'en_proceso': return 'info';
      default: return 'default';
    }
  };

  const formatDuration = (segundos) => {
    if (!segundos) return 'N/A';
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return minutos > 0 ? `${minutos}m ${segs}s` : `${segs}s`;
  };

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filtros.page,
        limit: pagination.limit,
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.usuario && { usuario: filtros.usuario }),
        ...(filtros.periodo && { periodo: filtros.periodo })
      });

  const response = await fetch(`${API_BASE_URL}/api/recibos/historial?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistorial(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error al obtener historial');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
  const response = await fetch(`${API_BASE_URL}/api/recibos/estadisticas`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHistorial();
      fetchEstadisticas();
    }
  }, [open, filtros.page, filtros.estado, filtros.usuario, filtros.periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiltroChange = (field, value) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset página al cambiar filtros
    }));
  };

  const handlePageChange = (event, newPage) => {
    setFiltros(prev => ({ ...prev, page: newPage }));
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 1200,
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 4,
        overflow: 'auto'
      }}>
        <Typography variant="h5" gutterBottom>
          Historial de Importaciones de Recibos
        </Typography>

        {/* Estadísticas */}
        {estadisticas && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{estadisticas.total_importaciones}</Typography>
                  <Typography variant="body2">Total</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">{estadisticas.completadas}</Typography>
                  <Typography variant="body2">Completadas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">{estadisticas.canceladas}</Typography>
                  <Typography variant="body2">Canceladas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="error.main">{estadisticas.con_error}</Typography>
                  <Typography variant="body2">Con Error</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{estadisticas.total_registros_importados?.toLocaleString()}</Typography>
                  <Typography variant="body2">Registros</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{formatDuration(Math.round(estadisticas.tiempo_promedio))}</Typography>
                  <Typography variant="body2">Tiempo Prom.</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Estado"
              fullWidth
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              {estados.map((estado) => (
                <MenuItem key={estado.value} value={estado.value}>
                  {estado.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Usuario"
              fullWidth
              value={filtros.usuario}
              onChange={(e) => handleFiltroChange('usuario', e.target.value)}
              placeholder="Filtrar por usuario..."
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Período"
              fullWidth
              value={filtros.periodo}
              onChange={(e) => handleFiltroChange('periodo', e.target.value)}
              placeholder="Ej: 04/2023"
            />
          </Grid>
        </Grid>

        {/* Tabla de historial */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="right">Fecha</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Archivo</TableCell>
                    <TableCell align="center">Período</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="right">Registros</TableCell>
                    <TableCell align="right">Duración</TableCell>
                    <TableCell>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historial.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell align="right">
                        {new Date(registro.fecha_importacion).toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell>{registro.usuario_importador}</TableCell>
                      <TableCell>{registro.archivo_importado}</TableCell>
                      <TableCell align="center">{registro.periodo_liquidacion}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={registro.estado_importacion}
                          color={getEstadoColor(registro.estado_importacion)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {registro.registros_exitosos || registro.registros_procesados} / {registro.total_registros}
                        {registro.registros_fallidos > 0 && (
                          <Typography variant="caption" color="error" display="block">
                            {registro.registros_fallidos} fallos
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{formatDuration(registro.tiempo_procesamiento)}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {registro.observaciones || 'Sin observaciones'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onClose}>
            Cerrar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default HistorialImportaciones;
