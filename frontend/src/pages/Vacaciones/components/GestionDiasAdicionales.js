import { API_BASE_URL } from '../../../config';
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';

const GestionDiasAdicionales = () => {
  const [dni, setDni] = useState('');
  const [empleado, setEmpleado] = useState(null);
  const [diasAdicionales, setDiasAdicionales] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const buscarEmpleado = async () => {
    if (!dni.trim()) {
      setError('Por favor ingresa un DNI');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setEmpleado(null);

      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/vacaciones/buscar-empleado/${dni}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar empleado');
      }

      setEmpleado(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const agregarDias = async () => {
    if (!empleado || !diasAdicionales || parseInt(diasAdicionales) <= 0) {
      setError('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      setLoadingAdd(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/vacaciones/agregar-dias`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario_id: empleado.id,
          dias_adicionales: parseInt(diasAdicionales),
          motivo: motivo.trim() || 'Días adicionales agregados por administrador',
          anio: new Date().getFullYear()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al agregar días');
      }

      setSuccess(`Se agregaron ${diasAdicionales} días adicionales a ${empleado.nombre} ${empleado.apellido}`);
      setDiasAdicionales('');
      setMotivo('');
      
      // Volver a buscar el empleado para actualizar los datos
      await buscarEmpleado();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarEmpleado();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Días Adicionales de Vacaciones
      </Typography>

      {/* Búsqueda de empleado */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Buscar Empleado
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                label="DNI del Empleado"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                onKeyPress={handleKeyPress}
                fullWidth
                placeholder="Ingresa el DNI sin puntos"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                onClick={buscarEmpleado}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                size="large"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Información del empleado */}
      {empleado && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Información del Empleado
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Nombre Completo
                    </TableCell>
                    <TableCell>{empleado.nombre} {empleado.apellido}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      DNI
                    </TableCell>
                    <TableCell>{empleado.dni}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Legajo
                    </TableCell>
                    <TableCell>{empleado.legajo}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Empresa
                    </TableCell>
                    <TableCell>{empleado.empresa_nombre || 'Sin asignar'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Fecha de Ingreso
                    </TableCell>
                    <TableCell>
                      {empleado.fecha_ingreso ? new Date(empleado.fecha_ingreso).toLocaleDateString() : 'No registrada'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      Antigüedad
                    </TableCell>
                    <TableCell>
                      {empleado.antiguedad_años ? `${empleado.antiguedad_años} años` : 'No calculada'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom color="secondary">
              Estado de Vacaciones {new Date().getFullYear()}
            </Typography>

            {empleado.anio ? (
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {empleado.dias_correspondientes || 0}
                    </Typography>
                    <Typography variant="body2">Días Correspondientes</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {empleado.dias_acumulados_previos || 0}
                    </Typography>
                    <Typography variant="body2">Días Acumulados</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {empleado.dias_tomados || 0}
                    </Typography>
                    <Typography variant="body2">Días Tomados</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {empleado.dias_disponibles || 0}
                    </Typography>
                    <Typography variant="body2">Días Disponibles</Typography>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="warning">
                Este empleado no tiene días de vacaciones asignados para el año {new Date().getFullYear()}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulario para agregar días */}
      {empleado && empleado.anio && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Agregar Días Adicionales
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Días Adicionales"
                  type="number"
                  value={diasAdicionales}
                  onChange={(e) => setDiasAdicionales(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 1, max: 30 }}
                  helperText="Máximo 30 días adicionales"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Motivo (opcional)"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  fullWidth
                  placeholder="Ej: Compensación por horas extra, Beneficio especial, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={agregarDias}
                  disabled={loadingAdd || !diasAdicionales || parseInt(diasAdicionales) <= 0}
                  startIcon={loadingAdd ? <CircularProgress size={20} /> : <AddIcon />}
                  size="large"
                  color="success"
                >
                  {loadingAdd ? 'Agregando...' : 'Agregar Días'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GestionDiasAdicionales;
