import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Assignment, Warning, CheckCircle, Error } from '@mui/icons-material';

const AsignacionProximoPeriodo = () => {
  const [anioDestino, setAnioDestino] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);

  const handleAsignar = async () => {
    setLoading(true);
    setError('');
    setResultado(null);

    try {
      const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/vacaciones/asignar-proximo-periodo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ anio_destino: anioDestino })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la asignación');
      }

      setResultado(data);
      setConfirmDialog(false);
    } catch (err) {
      setError(err.message);
      setConfirmDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = () => {
    if (!anioDestino || anioDestino < new Date().getFullYear()) {
      setError('Debe especificar el año actual o posterior');
      return;
    }
    setConfirmDialog(true);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assignment sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          Asignación de Vacaciones - Próximo Período
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Esta funcionalidad permite asignar automáticamente los días de vacaciones correspondientes 
        a todos los empleados para el próximo período anual, respetando las normas de la ley argentina.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Proceso automático:</strong>
          <br />• Calcula días según antigüedad (14/21/28/35 días)
          <br />• Mantiene días acumulados de períodos anteriores
          <br />• Registra historial de asignaciones
          <br />• Verifica que no existan asignaciones previas para el año
        </Typography>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="Año de destino"
          type="number"
          value={anioDestino}
          onChange={(e) => setAnioDestino(parseInt(e.target.value))}
          fullWidth
          helperText={`Año actual: ${new Date().getFullYear()} (se usará automáticamente)`}
          inputProps={{ min: new Date().getFullYear() }}
          disabled
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {resultado && (
        <Alert 
          severity={resultado.errores.length > 0 ? "warning" : "success"} 
          sx={{ mb: 3 }}
        >
          <Typography variant="h6" gutterBottom>
            {resultado.message}
          </Typography>
          <Typography variant="body2">
            Procesados: {resultado.procesados} de {resultado.total} empleados
          </Typography>
          
          {resultado.errores.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Errores encontrados:
              </Typography>
              <List dense>
                {resultado.errores.map((error, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText
                      primary={error.empleado}
                      secondary={error.error}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleConfirmar}
          disabled={loading}
          startIcon={loading ? null : <Assignment />}
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Procesando...' : 'Asignar Vacaciones'}
        </Button>
        
        {resultado && (
          <Chip
            icon={resultado.errores.length > 0 ? <Warning /> : <CheckCircle />}
            label={`${resultado.procesados} procesados`}
            color={resultado.errores.length > 0 ? "warning" : "success"}
          />
        )}
      </Box>

      {loading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Procesando empleados, esto puede tomar unos momentos...
          </Typography>
        </Box>
      )}

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ mr: 2, color: 'warning.main' }} />
            Confirmar Asignación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Está seguro que desea asignar las vacaciones para el año <strong>{anioDestino}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Procesará todos los empleados activos con legajo" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Calculará días según antigüedad al 1/1 del año destino" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Transferirá días acumulados del período anterior" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• No se puede deshacer automáticamente" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAsignar} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            Confirmar Asignación
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AsignacionProximoPeriodo;
