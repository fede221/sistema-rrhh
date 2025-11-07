import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Paper,
  Grid
} from '@mui/material';
import { API_BASE_URL } from '../../../config';

function NuevaSolicitud({ usuario_id, onSuccess }) {
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    comentarios: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar errores y advertencias al cambiar datos
    if (error) setError('');
    if (warnings.length > 0) setWarnings([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('📤 Enviando solicitud con:', {
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        comentarios: formData.comentarios
      });

      const res = await fetch(`${API_BASE_URL}/api/vacaciones/crear-solicitud`, {
        method: 'POST',
        credentials: 'include',  // Incluir cookies automáticamente
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
          comentarios: formData.comentarios
        })
      });

      console.log('📥 Respuesta del servidor:', { status: res.status });

      const data = await res.json();

      if (!res.ok) {
        console.log('❌ Error en respuesta:', data);
        if (data.errores && Array.isArray(data.errores)) {
          throw new Error(data.errores.join('. '));
        }
        throw new Error(data.error || 'Error al crear solicitud');
      }

      console.log('✅ Solicitud creada:', data);
      setSuccess(true);
      setWarnings(data.advertencias || []);
      setFormData({ fecha_inicio: '', fecha_fin: '', comentarios: '' });
      
      // Refrescar datos después de 3 segundos para que se vean las advertencias
      setTimeout(() => {
        onSuccess && onSuccess();
      }, 3000);
    } catch (err) {
      console.error('💥 Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          ✉️ Crear Nueva Solicitud de Vacaciones
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <div>
              <strong>⚠️ Advertencias:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </Alert>
        )}
        
        {success && <Alert severity="success" sx={{ mb: 2 }}>✓ Solicitud creada exitosamente. Pendiente aprobación del referente.</Alert>}

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
                label="Comentarios (opcional)"
                name="comentarios"
                value={formData.comentarios}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Motivo de la solicitud (viaje, motivos personales, etc.)"
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, background: '#f5f5f5' }}>
                <Typography variant="body2" color="textSecondary">
                  ℹ️ <strong>Importante:</strong> La solicitud debe cumplir con la Ley 20.744. Mínimo 10 días hábiles, continuos, iniciando lunes, antes del 31 de mayo.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !formData.fecha_inicio || !formData.fecha_fin}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : '📤 Enviar Solicitud'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}

export default NuevaSolicitud;
