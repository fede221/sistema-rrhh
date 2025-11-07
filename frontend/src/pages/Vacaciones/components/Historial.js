import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import { API_BASE_URL } from '../../../config';

function Historial({ usuario_id }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/vacaciones/historial/0`, {
        credentials: 'include',  // Incluir cookies automáticamente
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Error al cargar historial');
      const data = await res.json();
      setHistorial(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (historial.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            📄 No hay datos para mostrar
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Aún no tienes historial de vacaciones registrado en el sistema.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {historial.map((anio_data) => (
        <Card key={anio_data.anio} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📅 Año {anio_data.anio}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, background: '#e3f2fd', textAlign: 'center' }}>
                  <Typography color="textSecondary" variant="body2">
                    Días Base
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {anio_data.dias_correspondientes}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, background: '#fff3e0', textAlign: 'center' }}>
                  <Typography color="textSecondary" variant="body2">
                    Acumulados años anteriores
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                    {anio_data.dias_acumulados_previos}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, background: '#f3e5f5', textAlign: 'center' }}>
                  <Typography color="textSecondary" variant="body2">
                    No tomados años anteriores
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                    {anio_data.dias_no_tomados_año_anterior}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, background: '#e8f5e9', textAlign: 'center' }}>
                  <Typography color="textSecondary" variant="body2">
                    Total Disponible
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                    {anio_data.total_disponible}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Paper sx={{ p: 2, background: '#ffebee' }}>
                <Typography color="textSecondary" variant="body2">
                  Días Tomados
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c62828' }}>
                  {anio_data.dias_tomados}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, background: '#e0f2f1' }}>
                <Typography color="textSecondary" variant="body2">
                  Días Disponibles
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00796b' }}>
                  {anio_data.dias_disponibles_año}
                </Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default Historial;
