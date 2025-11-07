import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Card,
  CardContent,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Grid,
  Typography
} from '@mui/material';
import { API_BASE_URL } from '../../config';
import secureStorage from '../../utils/secureStorage';
import NuevaSolicitud from './components/NuevaSolicitud';
import MisSolicitudes from './components/MisSolicitudes';
import Historial from './components/Historial';

function PanelEmpleado() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diasDisponibles, setDiasDisponibles] = useState(null);
  const [sollicitudes, setSolicitudes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const usuario_id = secureStorage.getItem('userId');

  useEffect(() => {
    cargarDatos();
  }, [refreshKey]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener días disponibles
      const diasRes = await fetch(`${API_BASE_URL}/api/vacaciones/dias-disponibles/${usuario_id}`, {
        credentials: 'include',  // Incluir cookies automáticamente
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!diasRes.ok) throw new Error('Error al obtener días disponibles');
      const diasData = await diasRes.json();
      setDiasDisponibles(diasData[0] || null);

      // Obtener mis solicitudes
      const solRes = await fetch(`${API_BASE_URL}/api/vacaciones/mis-solicitudes/${usuario_id}`, {
        credentials: 'include',  // Incluir cookies automáticamente
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!solRes.ok) throw new Error('Error al obtener solicitudes');
      const solData = await solRes.json();
      setSolicitudes(solData);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        🏖️ Mis Vacaciones 2025
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* RESUMEN DÍAS */}
      {diasDisponibles && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="inherit" gutterBottom>
                  Disponibles 2025
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {diasDisponibles.dias_disponibles || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="inherit" gutterBottom>
                  Acumulados años anteriores
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {diasDisponibles.dias_acumulados_previos || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="inherit" gutterBottom>
                  Tomados
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {sollicitudes.filter(s => s.estado === 'aprobado').reduce((acc, s) => acc + s.dias_solicitados, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="inherit" gutterBottom>
                  Total Disponible
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {(diasDisponibles.dias_disponibles || 0) + (diasDisponibles.dias_acumulados_previos || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TABS */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Nueva Solicitud" icon="✍️" iconPosition="start" />
          <Tab label="Mis Solicitudes" icon="📋" iconPosition="start" />
          <Tab label="Historial" icon="📚" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* CONTENIDO TABS */}
      {tabValue === 0 && <NuevaSolicitud usuario_id={usuario_id} onSuccess={handleRefresh} />}
      {tabValue === 1 && <MisSolicitudes solicitudes={sollicitudes} />}
      {tabValue === 2 && <Historial usuario_id={usuario_id} />}
    </Container>
  );
}

export default PanelEmpleado;
