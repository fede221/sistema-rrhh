import React from 'react';
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
  LinearProgress,
  Grid,
  Alert
} from '@mui/material';

const ResumenVacaciones = ({ usuarioId, resumen }) => {
  if (!resumen || resumen.length === 0) {
    return (
      <Alert severity="info">
        No hay información de vacaciones disponible.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Resumen de Vacaciones por Año
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Año</TableCell>
                <TableCell align="center">Asignado</TableCell>
                <TableCell align="center">Tomado</TableCell>
                <TableCell align="center">Pendiente</TableCell>
                <TableCell align="center">Disponible</TableCell>
                <TableCell>Progreso</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumen.map((item) => {
                const totalAsignado = (item.dias_correspondientes || 0) + (item.dias_acumulados_previos || 0) + (item.dias_no_tomados_año_anterior || 0);
                const porcentajeUsado = totalAsignado > 0 ? ((item.dias_tomados || 0) / totalAsignado) * 100 : 0;
                
                return (
                  <TableRow key={item.anio}>
                    <TableCell>
                      <Typography variant="h6" component="span">
                        {item.anio}
                      </Typography>
                      {item.anio === new Date().getFullYear() && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            ml: 1, 
                            px: 1, 
                            py: 0.5, 
                            backgroundColor: 'primary.main', 
                            color: 'white', 
                            borderRadius: 1 
                          }}
                        >
                          Actual
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" fontWeight="bold">
                        {totalAsignado}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" color="primary">
                        {item.dias_tomados || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" color="warning.main">
                        {item.dias_pendientes || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body1" 
                        color={item.dias_disponibles > 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {item.dias_disponibles || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 150 }}>
                        <LinearProgress
                          variant="determinate"
                          value={porcentajeUsado}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'grey.200'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {porcentajeUsado.toFixed(1)}% usado
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Estadísticas adicionales */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Estadísticas Generales
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#e3f2fd', textAlign: 'center' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Años con Vacaciones
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    {resumen.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#f3e5f5', textAlign: 'center' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Días Tomados
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>
                    {resumen.reduce((total, item) => total + (item.dias_tomados || 0), 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#fff3e0', textAlign: 'center' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Pendientes
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#ef6c00', fontWeight: 'bold' }}>
                    {resumen.reduce((total, item) => total + (item.dias_pendientes || 0), 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#e8f5e8', textAlign: 'center' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Disponibles
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    {resumen.reduce((total, item) => total + (item.dias_disponibles || 0), 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResumenVacaciones;
