import React, { useState } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Alert
} from '@mui/material';
import NuevaSolicitudRefactor from './NuevaSolicitudRefactor';
import MisSolicitudesRefactor from './MisSolicitudesRefactor';

/**
 * Dashboard principal de vacaciones para empleados
 */
function DashboardVacacionesRefactor() {
  const [tabActivo, setTabActivo] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabActivo(newValue);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3}>
        {/* Header */}
        <Box sx={{ p: 3, bgcolor: '#1976d2', color: 'white' }}>
          <Typography variant="h4" gutterBottom>
            🏖️ Gestión de Vacaciones
          </Typography>
          <Typography variant="body2">
            Ley 20.744 - Contrato de Trabajo Argentino
          </Typography>
        </Box>

        {/* Alert informativo */}
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            💡 <strong>Proceso de aprobación:</strong> Tu solicitud será revisada por tu referente y luego por RH.
          </Alert>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabActivo}
          onChange={handleTabChange}
          aria-label="vacation tabs"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="📝 Nueva Solicitud" />
          <Tab label="📋 Mis Solicitudes" />
        </Tabs>

        {/* Contenido del tab */}
        <Box sx={{ p: 3 }}>
          {tabActivo === 0 && <NuevaSolicitudRefactor />}
          {tabActivo === 1 && <MisSolicitudesRefactor />}
        </Box>
      </Paper>
    </Container>
  );
}

export default DashboardVacacionesRefactor;
