import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { getToken, getUser } from '../utils/auth';
import usePermisos from '../hooks/usePermisos';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Modal,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const GestionLegajos = ({ open, onClose }) => {
  const user = getUser();
  const { esSuperAdmin, tienePermiso } = usePermisos();
  const esAdminRRHH = user?.rol === 'admin_rrhh';
  const puedeEditarLegajoPropio = tienePermiso('legajos', 'editar_propio');
  const [legajos, setLegajos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados del modal de creación/edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLegajo, setEditingLegajo] = useState(null);
  const [formData, setFormData] = useState({
    empresa_id: '',
    numero_legajo: '',
    nombre: '',
    apellido: '',
    cuil: '',
    fecha_ingreso: '',
    cuenta_bancaria: '',
    banco_destino: '',
    centro_costos: '',
    tarea_desempenada: '',
    domicilio: '',
    localidad: '',
    codigo_postal: '',
    telefono_contacto: ''
  });

  // Estado del diálogo de confirmación de eliminación
  const [deleteDialog, setDeleteDialog] = useState({ open: false, legajoId: null });

  useEffect(() => {
    if (open) {
      cargarDatos();
    }
  }, [open]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [legajosRes, empresasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/legajos/mis-legajos`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        fetch(`${API_BASE_URL}/api/legajos/empresas`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ]);

      if (legajosRes.ok && empresasRes.ok) {
        const legajosData = await legajosRes.json();
        const empresasData = await empresasRes.json();
        setLegajos(legajosData);
        setEmpresas(empresasData);
      } else {
        setError('Error al cargar los datos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (legajo = null) => {
    if (legajo) {
      setEditingLegajo(legajo.id);
      setFormData({ ...legajo, empresa_id: legajo.empresa_id || '' });
    } else {
      setEditingLegajo(null);
      setFormData({
        empresa_id: '',
        numero_legajo: '',
        nombre: '',
        apellido: '',
        cuil: '',
        fecha_ingreso: '',
        cuenta_bancaria: '',
        banco_destino: '',
        centro_costos: '',
        tarea_desempenada: '',
        domicilio: '',
        localidad: '',
        codigo_postal: '',
        telefono_contacto: ''
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingLegajo(null);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingLegajo 
        ? `${API_BASE_URL}/api/legajos/actualizar/${editingLegajo}`
        : `${API_BASE_URL}/api/legajos/nuevo`;
      
      const method = editingLegajo ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(editingLegajo ? 'Legajo actualizado exitosamente' : 'Legajo creado exitosamente');
        handleCloseModal();
        cargarDatos();
      } else {
        setError(result.error || 'Error al guardar el legajo');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleDelete = async (legajoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/legajos/eliminar/${legajoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Legajo eliminado exitosamente');
        cargarDatos();
      } else {
        setError(result.error || 'Error al eliminar el legajo');
      }
    } catch (err) {
      setError('Error de conexión');
    }
    setDeleteDialog({ open: false, legajoId: null });
  };

  const empresasPorNombre = empresas.reduce((acc, empresa) => {
    acc[empresa.id] = empresa.nombre;
    return acc;
  }, {});

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', md: '80%' },
        maxHeight: '90%',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 3,
        overflow: 'auto'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            <BadgeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gestión de Legajos
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          {esSuperAdmin() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
              sx={{ mb: 2 }}
            >
              Agregar Nuevo Legajo
            </Button>
          )}
          {esAdminRRHH && !puedeEditarLegajoPropio && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Acceso restringido:</strong> No tienes permisos para editar tu legajo. 
                Contacta al administrador del sistema si necesitas realizar cambios.
              </Typography>
            </Alert>
          )}
          {esAdminRRHH && puedeEditarLegajoPropio && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Solo puedes editar tu propio legajo
            </Typography>
          )}
        </Box>

        {loading ? (
          <Typography>Cargando...</Typography>
        ) : (
          <Grid container spacing={2}>
            {legajos.map((legajo) => (
              <Grid item xs={12} md={6} key={legajo.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        Legajo #{legajo.numero_legajo}
                      </Typography>
                      <Chip
                        icon={<BusinessIcon />}
                        label={empresasPorNombre[legajo.empresa_id] || 'Sin empresa'}
                        color="primary"
                        size="small"
                      />
                    </Box>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          {legajo.nombre} {legajo.apellido}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>CUIL:</strong> {legajo.cuil || 'No especificado'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Fecha Ingreso:</strong> {legajo.fecha_ingreso ? (() => {
                            if (typeof legajo.fecha_ingreso !== 'string') {
                              return 'Fecha inválida';
                            }
                            const fechaParts = legajo.fecha_ingreso.split('-');
                            if (fechaParts.length === 3) {
                              const [year, month, day] = fechaParts;
                              return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
                            }
                            return legajo.fecha_ingreso;
                          })() : 'No especificado'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Centro de Costos:</strong> {legajo.centro_costos || 'No especificado'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Tarea:</strong> {legajo.tarea_desempenada || 'No especificado'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Cuenta Bancaria:</strong> {legajo.cuenta_bancaria || 'No especificado'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Banco:</strong> {legajo.banco_destino || 'No especificado'}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                  <CardActions>
                    {(esSuperAdmin() || (esAdminRRHH && puedeEditarLegajoPropio)) && (
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenModal(legajo)}
                      >
                        Editar
                      </Button>
                    )}
                    {esAdminRRHH && !puedeEditarLegajoPropio && (
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        disabled
                        sx={{ color: 'text.disabled' }}
                      >
                        Sin permisos
                      </Button>
                    )}
                    {esSuperAdmin() && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialog({ open: true, legajoId: legajo.id })}
                      >
                        Eliminar
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Modal de Creación/Edición */}
        <Modal open={modalOpen} onClose={handleCloseModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', md: '60%' },
            maxHeight: '90%',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            overflow: 'auto'
          }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {editingLegajo ? 'Editar Legajo' : 'Nuevo Legajo'}
            </Typography>

            {esAdminRRHH && puedeEditarLegajoPropio && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Permisos limitados:</strong> Como admin de RRHH, solo puedes editar campos básicos de contacto. 
                  Los campos administrativos como empresa, número de legajo, CUIL, fecha de ingreso y centro de costos 
                  están restringidos al superadmin.
                </Typography>
              </Alert>
            )}

            {esAdminRRHH && !puedeEditarLegajoPropio && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Sin permisos:</strong> No tienes autorización para editar legajos. 
                  Contacta al administrador del sistema para solicitar permisos.
                </Typography>
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Empresa"
                    name="empresa_id"
                    value={formData.empresa_id}
                    onChange={handleInputChange}
                    required
                    disabled={esAdminRRHH}
                    helperText={esAdminRRHH ? "Solo superadmin puede cambiar la empresa" : ""}
                  >
                    {empresas.map((empresa) => (
                      <MenuItem key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Número de Legajo"
                    name="numero_legajo"
                    value={formData.numero_legajo}
                    onChange={handleInputChange}
                    required
                    disabled={esAdminRRHH}
                    helperText={esAdminRRHH ? "Solo superadmin puede cambiar el número de legajo" : ""}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CUIL"
                    name="cuil"
                    value={formData.cuil}
                    onChange={handleInputChange}
                    disabled={esAdminRRHH}
                    helperText={esAdminRRHH ? "Solo superadmin puede cambiar el CUIL" : ""}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de Ingreso"
                    name="fecha_ingreso"
                    value={formData.fecha_ingreso}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    disabled={esAdminRRHH}
                    helperText={esAdminRRHH ? "Solo superadmin puede cambiar la fecha de ingreso" : ""}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cuenta Bancaria"
                    name="cuenta_bancaria"
                    value={formData.cuenta_bancaria}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Banco"
                    name="banco_destino"
                    value={formData.banco_destino}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Centro de Costos"
                    name="centro_costos"
                    value={formData.centro_costos}
                    onChange={handleInputChange}
                    disabled={esAdminRRHH}
                    helperText={esAdminRRHH ? "Solo superadmin puede cambiar el centro de costos" : ""}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tarea Desempeñada"
                    name="tarea_desempenada"
                    value={formData.tarea_desempenada}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Domicilio"
                    name="domicilio"
                    value={formData.domicilio}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Localidad"
                    name="localidad"
                    value={formData.localidad}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Código Postal"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Teléfono de Contacto"
                    name="telefono_contacto"
                    value={formData.telefono_contacto}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained">
                  {editingLegajo ? 'Actualizar' : 'Crear'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Diálogo de Confirmación de Eliminación */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, legajoId: null })}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Está seguro que desea eliminar este legajo? Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, legajoId: null })}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleDelete(deleteDialog.legajoId)}
              color="error"
              variant="contained"
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Modal>
  );
};

export default GestionLegajos;
