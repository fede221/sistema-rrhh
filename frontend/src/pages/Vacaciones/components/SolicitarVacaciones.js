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
  CircularProgress
} from '@mui/material';

const SolicitarVacaciones = ({ usuarioId, onSolicitudCreada, diasDisponibles }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calcular días solicitados (días laborables entre fechas)
  const calcularDiasSolicitados = () => {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    let dias = 0;
    
    for (let date = new Date(inicio); date <= fin; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No contar sábados y domingos
        dias++;
      }
    }
    
    return dias;
  };

  const diasSolicitados = calcularDiasSolicitados();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fechaInicio || !fechaFin) {
      setError('Por favor selecciona las fechas de inicio y fin');
      return;
    }

    if (new Date(fechaInicio) >= new Date(fechaFin)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    if (diasSolicitados > diasDisponibles) {
      setError(`No puedes solicitar más días de los disponibles (${diasDisponibles})`);
      return;
    }

    if (diasSolicitados === 0) {
      setError('Debes solicitar al menos un día laboral');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/vacaciones/solicitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: usuarioId,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          dias_solicitados: diasSolicitados,
          comentarios: comentarios.trim()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la solicitud');
      }

      setSuccess('Solicitud de vacaciones creada exitosamente');
      setFechaInicio('');
      setFechaFin('');
      setComentarios('');
      
      if (onSolicitudCreada) {
        onSolicitudCreada();
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Obtener fecha mínima (hoy)
  const hoy = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Nueva Solicitud de Vacaciones
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha de Inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: hoy
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha de Fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: fechaInicio || hoy
                }}
              />
            </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Días laborables solicitados: <strong>{diasSolicitados}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Días disponibles: <strong>{diasDisponibles}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Días restantes después de esta solicitud: <strong>{diasDisponibles - diasSolicitados}</strong>
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Comentarios (opcional)"
                  multiline
                  rows={3}
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  fullWidth
                  placeholder="Agrega cualquier comentario adicional sobre tu solicitud..."
                />
              </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || diasSolicitados === 0 || diasSolicitados > diasDisponibles}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Enviando...' : 'Solicitar Vacaciones'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};export default SolicitarVacaciones;
