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
  CircularProgress
} from '@mui/material';

const getAccionColor = (accion) => {
  switch (accion) {
    case 'aprobado': return 'success';
    case 'rechazado': return 'error';
    case 'creado': return 'info';
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

const HistorialVacaciones = ({ usuarioId }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/vacaciones/historial/${usuarioId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Error al cargar historial');
        
        const data = await response.json();
        setHistorial(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    cargarHistorial();
  }, [usuarioId]);

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
        <Typography variant="h6" gutterBottom>
          Historial de Vacaciones
        </Typography>

        {historial.length === 0 ? (
          <Alert severity="info">
            No tienes historial de vacaciones procesadas aún.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Período de Vacaciones</TableCell>
                  <TableCell align="center">Días</TableCell>
                  <TableCell align="center">Acción</TableCell>
                  <TableCell>Comentarios</TableCell>
                  <TableCell>Realizado Por</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historial.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {formatDate(item.fecha)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        <strong>Desde:</strong> {formatDate(item.fecha_inicio)}
                        <br />
                        <strong>Hasta:</strong> {formatDate(item.fecha_fin)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" component="span">
                        {item.dias_solicitados}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={item.accion ? (item.accion.charAt(0).toUpperCase() + item.accion.slice(1)) : 'Procesado'} 
                        color={getAccionColor(item.accion)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {item.comentarios || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.realizado_por_nombre && item.realizado_por_apellido 
                          ? `${item.realizado_por_nombre} ${item.realizado_por_apellido}`
                          : `Usuario ID: ${item.realizado_por}`
                        }
                      </Typography>
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

export default HistorialVacaciones;
