import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Typography
} from '@mui/material';
import { API_BASE_URL } from '../../../config';

const estadosColors = {
  pendiente_referente: 'warning',
  pendiente_rh: 'info',
  aprobado: 'success',
  rechazado_referente: 'error',
  rechazado_rh: 'error'
};

const estadosLabels = {
  pendiente_referente: '⏳ Pendiente Referente',
  pendiente_rh: '⏳ Pendiente RH',
  aprobado: '✅ Aprobado',
  rechazado_referente: '❌ Rechazado (Referente)',
  rechazado_rh: '❌ Rechazado (RH)'
};

/**
 * Componente para listar mis solicitudes de vacaciones
 */
function MisSolicitudesRefactor() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/vacaciones/mis-solicitudes`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar solicitudes');
      }

      const data = await response.json();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={<Typography variant="h6">📋 Mis Solicitudes de Vacaciones</Typography>}
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {solicitudes.length === 0 ? (
          <Alert severity="info">
            No tienes solicitudes registradas. Crea una nueva solicitud para comenzar.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Inicio</strong></TableCell>
                  <TableCell><strong>Fin</strong></TableCell>
                  <TableCell align="center"><strong>Días</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Comentarios</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {solicitudes.map((sol) => (
                  <TableRow key={sol.id} hover>
                    <TableCell>{formatearFecha(sol.fecha_inicio)}</TableCell>
                    <TableCell>{formatearFecha(sol.fecha_fin)}</TableCell>
                    <TableCell align="center"><strong>{sol.dias_solicitados}</strong></TableCell>
                    <TableCell>
                      <Chip
                        label={estadosLabels[sol.estado] || sol.estado}
                        color={estadosColors[sol.estado] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{sol.comentarios_empleado || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default MisSolicitudesRefactor;
