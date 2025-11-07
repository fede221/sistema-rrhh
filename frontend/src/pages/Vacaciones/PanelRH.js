import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import { API_BASE_URL } from '../../config';

function PanelRH() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [comentario, setComentario] = useState('');
  const [respondiendo, setRespondiendo] = useState(false);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/vacaciones/pendientes-rh`, {
        credentials: 'include',  // Incluir cookies automáticamente
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Error al cargar solicitudes');
      const data = await res.json();
      setSolicitudes(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setComentario('');
    setOpenDialog(true);
  };

  const handleRechazar = (solicitud) => {
    setSelectedSolicitud({ ...solicitud, rechazado: true });
    setComentario('');
    setOpenDialog(true);
  };

  const handleResponder = async (aprobado) => {
    try {
      setRespondiendo(true);
      const res = await fetch(
        `${API_BASE_URL}/api/vacaciones/responder-rh/${selectedSolicitud.id}`,
        {
          method: 'PUT',
          credentials: 'include',  // Incluir cookies automáticamente
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            aprobada: aprobado,
            comentarios: comentario
          })
        }
      );

      if (!res.ok) throw new Error('Error al responder solicitud');

      setOpenDialog(false);
      setComentario('');
      setSelectedSolicitud(null);
      cargarSolicitudes();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setRespondiendo(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        👥 Solicitudes de Vacaciones - Aprobación RH
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {solicitudes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">
              ✓ No hay solicitudes pendientes de aprobación por RH.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ background: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Puesto</strong></TableCell>
                <TableCell><strong>Período</strong></TableCell>
                <TableCell align="center"><strong>Días</strong></TableCell>
                <TableCell><strong>Referente</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {solicitudes.map((solicitud) => (
                <TableRow key={solicitud.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {solicitud.usuario_nombre}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {solicitud.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{solicitud.puesto || '-'}</TableCell>
                  <TableCell>
                    {new Date(solicitud.fecha_inicio).toLocaleDateString('es-AR')} -
                    {new Date(solicitud.fecha_fin).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`${solicitud.dias_solicitados} días`} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {solicitud.referente_nombre}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {solicitud.referente_comentario || 'Sin comentarios'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleAprobar(solicitud)}
                      >
                        ✓ Aprobar
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => handleRechazar(solicitud)}
                      >
                        ✗ Rechazar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* DIALOG PARA RESPONDER */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSolicitud?.rechazado ? '✗ Rechazar Solicitud' : '✓ Aprobar Solicitud Final'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedSolicitud && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Empleado</Typography>
                <Typography variant="body1">{selectedSolicitud.usuario_nombre}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Período</Typography>
                <Typography variant="body1">
                  {new Date(selectedSolicitud.fecha_inicio).toLocaleDateString('es-AR')} a{' '}
                  {new Date(selectedSolicitud.fecha_fin).toLocaleDateString('es-AR')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Aprobado por Referente</Typography>
                <Typography variant="body1">{selectedSolicitud.referente_nombre}</Typography>
              </Box>
              <TextField
                fullWidth
                label={selectedSolicitud.rechazado ? 'Motivo del rechazo' : 'Comentario (opcional)'}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                multiline
                rows={3}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          {selectedSolicitud?.rechazado ? (
            <Button
              variant="contained"
              color="error"
              onClick={() => handleResponder(false)}
              disabled={respondiendo}
            >
              {respondiendo ? <CircularProgress size={24} /> : 'Rechazar'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleResponder(true)}
              disabled={respondiendo}
            >
              {respondiendo ? <CircularProgress size={24} /> : 'Aprobar Final'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PanelRH;
