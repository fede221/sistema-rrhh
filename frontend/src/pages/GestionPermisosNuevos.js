import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Chip,
  Grid,
  Divider,
  Breadcrumbs
} from '@mui/material';
import { Add as AddIcon, Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const GestionPermisosNuevos = () => {
  const [nuevoPermiso, setNuevoPermiso] = useState({
    rol: '',
    modulo: '',
    permiso: '',
    activo: true
  });
  
  const [permisosTemporales, setPermisosTemporales] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'admin_rrhh', label: 'Admin RRHH' },
    { value: 'empleado', label: 'Empleado' },
    { value: 'referente', label: 'Referente' }
  ];

  const modulosComunes = [
    'usuarios', 'dashboard', 'recibos', 'vacaciones', 
    'legajos', 'reportes', 'configuracion', 'auditoria', 'mi_equipo'
  ];

  const permisosComunes = [
    'ver', 'crear', 'editar', 'eliminar', 'importar', 'exportar',
    'ver_propios', 'ver_todos', 'gestionar', 'aprobar'
  ];

  const agregarALista = () => {
    if (!nuevoPermiso.rol || !nuevoPermiso.modulo || !nuevoPermiso.permiso) {
      setMensaje({ tipo: 'error', texto: 'Todos los campos son obligatorios' });
      return;
    }

    const existe = permisosTemporales.some(p => 
      p.rol === nuevoPermiso.rol && 
      p.modulo === nuevoPermiso.modulo && 
      p.permiso === nuevoPermiso.permiso
    );

    if (existe) {
      setMensaje({ tipo: 'error', texto: 'Este permiso ya está en la lista' });
      return;
    }

    setPermisosTemporales([...permisosTemporales, { ...nuevoPermiso }]);
    setNuevoPermiso({ rol: '', modulo: '', permiso: '', activo: true });
    setMensaje({ tipo: 'success', texto: 'Permiso agregado a la lista' });
  };

  const eliminarDeLista = (index) => {
    const nuevaLista = permisosTemporales.filter((_, i) => i !== index);
    setPermisosTemporales(nuevaLista);
  };

  const guardarPermisos = async () => {
    if (permisosTemporales.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No hay permisos para guardar' });
      return;
    }

    setLoading(true);
    
    try {
      for (const permiso of permisosTemporales) {
        const response = await apiRequest('/api/permisos/agregar', {
          method: 'POST',
          body: JSON.stringify(permiso)
        });

        if (!response.ok) {
          throw new Error(`Error al guardar permiso: ${permiso.rol}.${permiso.modulo}.${permiso.permiso}`);
        }
      }

      setMensaje({ tipo: 'success', texto: `${permisosTemporales.length} permisos guardados exitosamente` });
      setPermisosTemporales([]);
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar permisos: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/permisos" style={{ color: 'inherit', textDecoration: 'none' }}>
          Gestión de Permisos
        </Link>
        <Typography color="text.primary">Agregar Nuevos</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/permisos"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          Agregar Nuevos Permisos
        </Typography>
      </Box>

      {mensaje.texto && (
        <Alert severity={mensaje.tipo} sx={{ mb: 3 }}>
          {mensaje.texto}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Crear Nuevo Permiso
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Rol"
              value={nuevoPermiso.rol}
              onChange={(e) => setNuevoPermiso({ ...nuevoPermiso, rol: e.target.value })}
            >
              {roles.map((rol) => (
                <MenuItem key={rol.value} value={rol.value}>
                  {rol.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Módulo"
              value={nuevoPermiso.modulo}
              onChange={(e) => setNuevoPermiso({ ...nuevoPermiso, modulo: e.target.value })}
              helperText="ej: usuarios, reportes, configuracion"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Permiso"
              value={nuevoPermiso.permiso}
              onChange={(e) => setNuevoPermiso({ ...nuevoPermiso, permiso: e.target.value })}
              helperText="ej: ver, crear, editar, eliminar"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={agregarALista}
              sx={{ height: '56px' }}
            >
              Agregar a Lista
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Módulos comunes:
        </Typography>
        <Box sx={{ mb: 2 }}>
          {modulosComunes.map((modulo) => (
            <Chip
              key={modulo}
              label={modulo}
              variant="outlined"
              size="small"
              sx={{ m: 0.5 }}
              onClick={() => setNuevoPermiso({ ...nuevoPermiso, modulo })}
            />
          ))}
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Permisos comunes:
        </Typography>
        <Box>
          {permisosComunes.map((permiso) => (
            <Chip
              key={permiso}
              label={permiso}
              variant="outlined"
              size="small"
              sx={{ m: 0.5 }}
              onClick={() => setNuevoPermiso({ ...nuevoPermiso, permiso })}
            />
          ))}
        </Box>
      </Paper>

      {permisosTemporales.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Permisos a Guardar ({permisosTemporales.length})
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={guardarPermisos}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Todos'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {permisosTemporales.map((permiso, index) => (
              <Chip
                key={index}
                label={`${permiso.rol}.${permiso.modulo}.${permiso.permiso}`}
                color="primary"
                onDelete={() => eliminarDeLista(index)}
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default GestionPermisosNuevos;