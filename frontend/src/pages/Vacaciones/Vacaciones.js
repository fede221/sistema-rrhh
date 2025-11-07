import React from 'react';
import { Container, Alert, Box } from '@mui/material';
import secureStorage from '../../utils/secureStorage';
import PanelEmpleado from './PanelEmpleado';
import PanelReferente from './PanelReferente';
import PanelRH from './PanelRH';

const Vacaciones = () => {
  // Obtener rol del usuario
  const rol = secureStorage.getItem('userRol');

  // Si no hay rol, mostrar error
  if (!rol) {
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

  // Renderizar según el rol
  if (rol === 'empleado') {
    return <PanelEmpleado />;
  } else if (rol === 'referente_vacaciones' || rol === 'superadmin') {
    return <PanelReferente />;
  } else if (rol === 'admin_rrhh' || rol === 'superadmin') {
    return <PanelRH />;
  } else {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="warning">
            Tu rol no tiene acceso al módulo de vacaciones.
          </Alert>
        </Box>
      </Container>
    );
  }
};

export default Vacaciones;
