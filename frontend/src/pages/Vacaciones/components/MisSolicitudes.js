import { API_BASE_URL } from '../../../config';
import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip
} from '@mui/material';
import { Refresh } from '@mui/icons-material';

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

const MisSolicitudes = ({ usuarioId }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/vacaciones/mis-solicitudes/${usuarioId}`, {
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
  }, [usuarioId]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

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

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Mis Solicitudes de Vacaciones
          </Typography>
          <Tooltip title="Actualizar">
            <IconButton onClick={cargarSolicitudes}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {solicitudes.length === 0 ? (
          <Alert severity="info">
            No has realizado ninguna solicitud de vacaciones aún.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha Solicitud</TableCell>
                  <TableCell>Período</TableCell>
                  <TableCell align="center">Días</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell>Comentarios</TableCell>
                  <TableCell>Fecha Respuesta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {solicitudes.map((solicitud) => (
                  <TableRow key={solicitud.id}>
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
                        label={solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)} 
                        color={getEstadoColor(solicitud.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {solicitud.comentarios || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {solicitud.fecha_respuesta 
                        ? formatDate(solicitud.fecha_respuesta)
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default MisSolicitudes;
