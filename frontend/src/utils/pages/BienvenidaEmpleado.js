import React from 'react';
import secureStorage from '../secureStorage';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import {
  WavingHand as WavingHandIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { getUser } from '../auth';

const BienvenidaEmpleado = () => {
  const user = getUser();
  
  // Obtener información adicional desde secureStorage
  const dni = secureStorage.getItem('userDni') || 'No disponible';
  const cuil = secureStorage.getItem('userCuil') || 'No disponible';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Verificar que sea una cadena antes de usar split
    if (typeof dateString !== 'string') {
      console.warn('formatDate recibió un valor no string:', dateString);
      return 'N/A';
    }
    
    // Evitar problemas de timezone usando split en lugar de new Date()
    const fechaParts = dateString.split('-');
    if (fechaParts.length === 3) {
      const [year, month, day] = fechaParts;
      // Crear la fecha con las partes individuales para evitar timezone
      const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return fecha.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return dateString;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Encabezado de bienvenida */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <WavingHandIcon sx={{ fontSize: 48, mr: 1 }} />
        </Box>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user?.nombre || 'Usuario'}!
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Bienvenido al Sistema de Recursos Humanos
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
          {formatDate(new Date().toISOString().split('T')[0])}
        </Typography>
      </Paper>

      {/* Información del empleado */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6">
                  Información Personal
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Nombre Completo
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {user?.nombre} {user?.apellido}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  No disponible
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  DNI
                </Typography>
                <Typography variant="body1">
                  {dni}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  CUIL
                </Typography>
                <Typography variant="body1">
                  {cuil}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <BadgeIcon />
                </Avatar>
                <Typography variant="h6">
                  Información Laboral
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Rol
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Empleado
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Estado
                </Typography>
                <Typography variant="body1" color="success.main" fontWeight="bold">
                  Activo
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Empresa
                </Typography>
                <Typography variant="body1">
                  Sistema RRHH
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mensaje informativo */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
            <BusinessIcon />
          </Avatar>
          <Typography variant="h6">
            Sistema de Recursos Humanos
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Este es tu portal de empleado donde podrás acceder a la información relacionada 
          con tu trabajo y realizar consultas sobre tus datos laborales.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Si necesitas realizar alguna consulta o tienes alguna pregunta, 
          no dudes en contactar al departamento de Recursos Humanos.
        </Typography>
      </Paper>
    </Box>
  );
};

export default BienvenidaEmpleado;