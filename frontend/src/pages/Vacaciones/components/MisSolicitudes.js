import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

function MisSolicitudes({ solicitudes }) {
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const getEstadoColor = (estado) => {
    const estadoMap = {
      'pendiente_referente': 'warning',
      'pendiente_rh': 'info',
      'aprobado': 'success',
      'rechazado_referente': 'error',
      'rechazado_rh': 'error'
    };
    return estadoMap[estado] || 'default';
  };

  const getEstadoLabel = (estado) => {
    const labelMap = {
      'pendiente_referente': '⏳ Pendiente Referente',
      'pendiente_rh': '⏳ Pendiente RH',
      'aprobado': '✓ Aprobado',
      'rechazado_referente': '✗ Rechazado (Referente)',
      'rechazado_rh': '✗ Rechazado (RH)'
    };
    return labelMap[estado] || estado;
  };

  const handleViewDetails = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSolicitud(null);
  };

  if (solicitudes.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">
            No tienes solicitudes de vacaciones aún.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ background: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Período</strong></TableCell>
              <TableCell align="center"><strong>Días</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {solicitudes.map((solicitud) => (
              <TableRow key={solicitud.id} hover>
                <TableCell>
                  {new Date(solicitud.fecha_inicio).toLocaleDateString('es-AR')} - {' '}
                  {new Date(solicitud.fecha_fin).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell align="center">
                  <Chip label={`${solicitud.dias_solicitados} días`} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getEstadoLabel(solicitud.estado)}
                    color={getEstadoColor(solicitud.estado)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetails(solicitud)}
                  >
                    Ver detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIALOG CON DETALLES */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>📋 Detalles de Solicitud</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedSolicitud && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Período</Typography>
                <Typography variant="body1">
                  {new Date(selectedSolicitud.fecha_inicio).toLocaleDateString('es-AR')} a{' '}
                  {new Date(selectedSolicitud.fecha_fin).toLocaleDateString('es-AR')}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary">Días solicitados</Typography>
                <Typography variant="body1">{selectedSolicitud.dias_solicitados}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary">Estado</Typography>
                <Chip
                  label={getEstadoLabel(selectedSolicitud.estado)}
                  color={getEstadoColor(selectedSolicitud.estado)}
                />
              </Box>

              {selectedSolicitud.comentarios_empleado && (
                <Box>
                  <Typography variant="body2" color="textSecondary">Tus comentarios</Typography>
                  <Typography variant="body2">{selectedSolicitud.comentarios_empleado}</Typography>
                </Box>
              )}

              {selectedSolicitud.referente_nombre && (
                <Box sx={{ p: 1.5, background: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    ✓ Aprobado por: {selectedSolicitud.referente_nombre}
                  </Typography>
                  {selectedSolicitud.referente_comentario && (
                    <Typography variant="body2">
                      Comentario: {selectedSolicitud.referente_comentario}
                    </Typography>
                  )}
                  <Typography variant="caption" color="textSecondary">
                    Fecha: {new Date(selectedSolicitud.fecha_referente).toLocaleString('es-AR')}
                  </Typography>
                </Box>
              )}

              {selectedSolicitud.rh_nombre && (
                <Box sx={{ p: 1.5, background: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    ✓ Aprobado por RH: {selectedSolicitud.rh_nombre}
                  </Typography>
                  {selectedSolicitud.rh_comentario && (
                    <Typography variant="body2">
                      Comentario: {selectedSolicitud.rh_comentario}
                    </Typography>
                  )}
                  <Typography variant="caption" color="textSecondary">
                    Fecha: {new Date(selectedSolicitud.fecha_rh).toLocaleString('es-AR')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default MisSolicitudes;
