import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Grid,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { API_BASE_URL } from '../../../config';

/**
 * Componente para crear nuevas solicitudes de vacaciones
 */
function NuevaSolicitudRefactor() {
  // Estado del formulario
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    comentarios: ''
  });

  // Estado general
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [advertencias, setAdvertencias] = useState([]);
  const [solicitudCreada, setSolicitudCreada] = useState(false);
  const [solicitudId, setSolicitudId] = useState(null);

  // Manejador de cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejador de envío
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAdvertencias([]);

    try {
      const payload = {
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        comentarios: formData.comentarios
      };

      console.log('📤 Enviando solicitud:', payload);

      const response = await fetch(`${API_BASE_URL}/api/vacaciones/crear-solicitud`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear solicitud');
        if (data.advertencias) {
          setAdvertencias(data.advertencias);
        }
        return;
      }

      // Éxito
      console.log('✅ Solicitud creada:', data);
      setSolicitudId(data.solicitud_id);
      setSolicitudCreada(true);

      // Limpiar formulario
      setFormData({
        fecha_inicio: '',
        fecha_fin: '',
        comentarios: ''
      });

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSolicitudCreada(false);
      }, 5000);
    } catch (err) {
      console.error('💥 Error:', err);
      setError(err.message || 'Error al crear solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={<Typography variant="h6">📝 Nueva Solicitud de Vacaciones</Typography>}
        subheader="Ley 20.744 - Contrato de Trabajo Argentino"
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <ErrorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {error}
          </Alert>
        )}

        {advertencias.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {advertencias.map((adv, i) => (
              <div key={i}>• {adv}</div>
            ))}
          </Alert>
        )}

        {solicitudCreada && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            ✓ Solicitud creada exitosamente (ID: {solicitudId})
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Inicio"
                name="fecha_inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Fin"
                name="fecha_fin"
                type="date"
                value={formData.fecha_fin}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentarios"
                name="comentarios"
                multiline
                rows={3}
                value={formData.comentarios}
                onChange={handleChange}
                disabled={loading}
                placeholder="Comentarios adicionales (opcional)"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !formData.fecha_inicio || !formData.fecha_fin}
                >
                  {loading ? <CircularProgress size={24} /> : 'Solicitar Vacaciones'}
                </Button>
                <Button
                  type="reset"
                  variant="outlined"
                  onClick={() => setFormData({ fecha_inicio: '', fecha_fin: '', comentarios: '' })}
                  disabled={loading}
                >
                  Limpiar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Notas legales */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: '#f5f5f5' }}>
          <Typography variant="caption" display="block" gutterBottom>
            📋 Requisitos Ley 20.744:
          </Typography>
          <Typography variant="caption" component="div">
            • Mínimo 10 días hábiles de vacaciones
          </Typography>
          <Typography variant="caption" component="div">
            • Idealmente debe comenzar lunes
          </Typography>
          <Typography variant="caption" component="div">
            • Período recomendado: 1 octubre - 30 abril
          </Typography>
          <Typography variant="caption" component="div">
            • Requiere aprobación de referente y RH
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
}

export default NuevaSolicitudRefactor;
