import { API_BASE_URL } from '../../../config';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { getToken } from '../../auth';

const GestionEmpresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    razon_social: '',
    cuit: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto_nombre: '',
    contacto_telefono: '',
    contacto_email: '',
    descripcion: '',
    activa: true
  });
  const [logoFile, setLogoFile] = useState(null);
  const [firmaFile, setFirmaFile] = useState(null);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
  const response = await fetch(`${API_BASE_URL}/empresas`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
      } else {
        setError('Error al cargar empresas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (empresa = null, view = false) => {
    if (empresa) {
      setFormData({
        nombre: empresa.nombre || '',
        razon_social: empresa.razon_social || '',
        cuit: empresa.cuit || '',
        direccion: empresa.direccion || '',
        telefono: empresa.telefono || '',
        email: empresa.email || '',
        contacto_nombre: empresa.contacto_nombre || '',
        contacto_telefono: empresa.contacto_telefono || '',
        contacto_email: empresa.contacto_email || '',
        descripcion: empresa.descripcion || '',
        activa: empresa.activa
      });
      setSelectedEmpresa(empresa);
    } else {
      setFormData({
        nombre: '',
        razon_social: '',
        cuit: '',
        direccion: '',
        telefono: '',
        email: '',
        contacto_nombre: '',
        contacto_telefono: '',
        contacto_email: '',
        descripcion: '',
        activa: true
      });
      setSelectedEmpresa(null);
    }
    setViewMode(view);
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmpresa(null);
    setViewMode(false);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'logo') setLogoFile(files[0]);
    if (name === 'firma') setFirmaFile(files[0]);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      // Validaciones básicas
      if (!formData.nombre.trim() || !formData.razon_social.trim()) {
        setError('Nombre y razón social son obligatorios');
        return;
      }

      const url = selectedEmpresa 
  ? `${API_BASE_URL}/empresas/${selectedEmpresa.id}` 
  : `${API_BASE_URL}/empresas`;
      
      const method = selectedEmpresa ? 'PUT' : 'POST';

      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });
      if (logoFile) form.append('logo', logoFile);
      if (firmaFile) form.append('firma', firmaFile);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: form
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(selectedEmpresa ? 'Empresa actualizada exitosamente' : 'Empresa creada exitosamente');
        handleCloseDialog();
        cargarEmpresas();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleToggleEstado = async (empresa) => {
    try {
  const response = await fetch(`${API_BASE_URL}/empresas/${empresa.id}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activa: !empresa.activa })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        cargarEmpresas();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Error al cambiar estado');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleEliminar = async (empresa) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar la empresa "${empresa.nombre}"?`)) {
      return;
    }

    try {
  const response = await fetch(`${API_BASE_URL}/empresas/${empresa.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        cargarEmpresas();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Error al eliminar empresa');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando empresas...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestión de Empresas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'primary.main' }}
        >
          Nueva Empresa
        </Button>
      </Box>

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Razón Social</strong></TableCell>
              <TableCell><strong>CUIT</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {empresa.nombre}
                  </Typography>
                </TableCell>
                <TableCell>{empresa.razon_social}</TableCell>
                <TableCell>{empresa.cuit || '-'}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {empresa.descripcion || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={empresa.activa ? 'Activa' : 'Inactiva'}
                    color={empresa.activa ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Ver detalles">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(empresa, true)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(empresa)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={empresa.activa ? 'Desactivar' : 'Activar'}>
                    <IconButton
                      size="small"
                      color={empresa.activa ? 'warning' : 'success'}
                      onClick={() => handleToggleEstado(empresa)}
                    >
                      <Switch
                        checked={empresa.activa}
                        size="small"
                        onChange={() => {}}
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleEliminar(empresa)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar/ver empresa */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {viewMode ? 'Detalles de la Empresa' : 
           selectedEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Información básica */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre *"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Razón Social *"
                name="razon_social"
                value={formData.razon_social}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CUIT"
                name="cuit"
                value={formData.cuit}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
                placeholder="20-12345678-9"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
              />
            </Grid>

            {/* Información de contacto */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Contacto
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Contacto"
                name="contacto_nombre"
                value={formData.contacto_nombre}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono del Contacto"
                name="contacto_telefono"
                value={formData.contacto_telefono}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email del Contacto"
                name="contacto_email"
                type="email"
                value={formData.contacto_email}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción / Actividad"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                disabled={viewMode}
                margin="dense"
                multiline
                rows={2}
                placeholder="Ej: Gastronomía, Servicios de restaurantes, etc."
              />
            </Grid>

            {!viewMode && (
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="activa"
                      checked={formData.activa}
                      onChange={handleInputChange}
                    />
                  }
                  label="Empresa Activa"
                  sx={{ mt: 1 }}
                />
              </Grid>
            )}

            {/* Carga de archivos */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Logo de la empresa (opcional)</Typography>
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleFileChange}
                disabled={viewMode}
                style={{ marginTop: 4 }}
              />
              {selectedEmpresa && selectedEmpresa.logo_url && (
                <Box mt={1}>
                  <img src={selectedEmpresa.logo_url} alt="Logo" style={{ maxHeight: 50, maxWidth: 120, borderRadius: 6 }} />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Firma digital (opcional)</Typography>
              <input
                type="file"
                name="firma"
                accept="image/*"
                onChange={handleFileChange}
                disabled={viewMode}
                style={{ marginTop: 4 }}
              />
              {selectedEmpresa && selectedEmpresa.firma_url && (
                <Box mt={1}>
                  <img src={selectedEmpresa.firma_url} alt="Firma" style={{ maxHeight: 50, maxWidth: 120, borderRadius: 6 }} />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {viewMode ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!viewMode && (
            <Button onClick={handleSubmit} variant="contained">
              {selectedEmpresa ? 'Actualizar' : 'Crear'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionEmpresas;
