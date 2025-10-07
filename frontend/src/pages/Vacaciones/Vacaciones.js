import { API_BASE_URL } from '../../config';
import React, { useState, useEffect, useCallback } from 'react';
import secureStorage from '../../utils/secureStorage';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Alert
} from '@mui/material';
import { CalendarToday, History, Add, Assessment, PersonAdd, Assignment } from '@mui/icons-material';
import SolicitarVacaciones from './components/SolicitarVacaciones';
import MisSolicitudes from './components/MisSolicitudes';
import HistorialVacaciones from './components/HistorialVacaciones';
import ResumenVacaciones from './components/ResumenVacaciones';
import GestionSolicitudes from './components/GestionSolicitudes';
import GestionDiasAdicionales from './components/GestionDiasAdicionales';
import AsignacionProximoPeriodo from '../../components/AsignacionProximoPeriodo';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Vacaciones = () => {
  const [tabValue, setTabValue] = useState(0);
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Leer datos del usuario desde secureStorage (formato individual)
  const userData = {
    id: secureStorage.getItem('userId'),
    nombre: secureStorage.getItem('userNombre'),
    apellido: secureStorage.getItem('userApellido'),
    rol: secureStorage.getItem('userRol'),
    dni: secureStorage.getItem('userDni')
  };

  // También intentar leer el formato de objeto por compatibilidad
  const userDataObj = JSON.parse(localStorage.getItem('userData') || '{}');
  
  // Usar el que tenga datos
  const user = userData.id ? userData : userDataObj;
  const isAdmin = user.rol === 'administrador' || user.rol === 'superadmin';


  const cargarResumen = useCallback(async () => {
    try {
      if (!user.id) {
        setError('No se encontraron datos del usuario. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      
      
  const response = await fetch(`${API_BASE_URL}/api/vacaciones/resumen/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar resumen');
      
      const data = await response.json();
      setResumen(data);
      setError(''); // Limpiar error si todo fue bien
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar el resumen de vacaciones');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  // Si no hay datos de usuario, mostrar error
  if (!user.id) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            No se encontraron datos del usuario. Por favor, inicia sesión nuevamente.
          </Alert>
        </Box>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const añoActual = new Date().getFullYear();
  const resumenActual = resumen.find(r => r.anio === añoActual) || {};

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Gestión de Vacaciones
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Resumen rápido */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#e3f2fd' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Días Disponibles {añoActual}
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {loading ? '-' : resumenActual.dias_disponibles || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#f3e5f5' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Días Tomados
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>
                  {loading ? '-' : resumenActual.dias_tomados || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#fff3e0' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Días Pendientes
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: '#ef6c00', fontWeight: 'bold' }}>
                  {loading ? '-' : resumenActual.dias_pendientes || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#e8f5e8' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Asignado
                </Typography>
                <Typography variant="h4" component="div" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  {loading ? '-' : (
                    (resumenActual.dias_correspondientes || 0) + 
                    (resumenActual.dias_acumulados_previos || 0) + 
                    (resumenActual.dias_no_tomados_año_anterior || 0)
                  ) || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Barra de progreso */}
        {!loading && (resumenActual.dias_correspondientes || resumenActual.dias_acumulados_previos) && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Uso de Vacaciones {añoActual}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={
                    (() => {
                      const totalDias = (resumenActual.dias_correspondientes || 0) + 
                                       (resumenActual.dias_acumulados_previos || 0) + 
                                       (resumenActual.dias_no_tomados_año_anterior || 0);
                      const diasTomados = resumenActual.dias_tomados || 0;
                      return totalDias > 0 ? (diasTomados / totalDias) * 100 : 0;
                    })()
                  }
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {resumenActual.dias_tomados || 0} de {
                    (resumenActual.dias_correspondientes || 0) + 
                    (resumenActual.dias_acumulados_previos || 0) + 
                    (resumenActual.dias_no_tomados_año_anterior || 0)
                  } días utilizados
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="vacaciones tabs">
              <Tab 
                icon={<Add />} 
                label="Solicitar" 
                iconPosition="start"
              />
              <Tab 
                icon={<CalendarToday />} 
                label="Mis Solicitudes" 
                iconPosition="start"
              />
              <Tab 
                icon={<History />} 
                label="Historial" 
                iconPosition="start"
              />
              <Tab 
                icon={<Assessment />} 
                label="Resumen" 
                iconPosition="start"
              />
              {isAdmin && [
                <Tab 
                  key="admin-tab"
                  icon={<Assessment />} 
                  label="Gestión Admin" 
                  iconPosition="start"
                />,
                <Tab 
                  key="dias-tab"
                  icon={<PersonAdd />} 
                  label="Días Adicionales" 
                  iconPosition="start"
                />,
                <Tab 
                  key="periodo-tab"
                  icon={<Assignment />} 
                  label="Próximo Período" 
                  iconPosition="start"
                />
              ]}
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <SolicitarVacaciones 
              usuarioId={user.id} 
              onSolicitudCreada={cargarResumen}
              diasDisponibles={resumenActual.dias_disponibles || 0}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <MisSolicitudes usuarioId={user.id} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <HistorialVacaciones usuarioId={user.id} />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <ResumenVacaciones usuarioId={user.id} resumen={resumen} />
          </TabPanel>

          {isAdmin && [
            <TabPanel key="admin-panel" value={tabValue} index={4}>
              <GestionSolicitudes />
            </TabPanel>,
            <TabPanel key="dias-panel" value={tabValue} index={5}>
              <GestionDiasAdicionales />
            </TabPanel>,
            <TabPanel key="periodo-panel" value={tabValue} index={6}>
              <AsignacionProximoPeriodo />
            </TabPanel>
          ]}
        </Card>
      </Box>
    </Container>
  );
};

export default Vacaciones;
