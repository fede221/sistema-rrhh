import { API_BASE_URL } from '../../config';
import React, { useEffect, useState } from 'react';
import { Typography, Box, Paper, Grid, Divider } from '@mui/material';
import { getToken } from '../../utils/auth';

const Legajo = () => {
  const [legajo, setLegajo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLegajo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/mi-legajo`, {
          headers: { Authorization: `Bearer ${getToken && getToken()}` }
        });
        const data = await res.json();
        setLegajo(data);
      } catch (err) {
        setLegajo(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLegajo();
  }, []);

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Cargando datos del legajo...</Typography></Box>;
  }

  if (!legajo) {
    return <Box sx={{ p: 3 }}><Typography>No se encontraron datos de tu legajo.</Typography></Box>;
  }

  // Helper para formatear fechas
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    
    // Verificar que sea una cadena
    if (typeof fecha !== 'string') {
      console.warn('formatFecha recibió un valor no string:', fecha);
      return '';
    }
    
    if (fecha.includes('T')) {
      const [y, m, d] = fecha.split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, m, d] = fecha.split('-');
      return `${d}/${m}/${y}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      return fecha;
    }
    return fecha;
  };

  // Componente reutilizable para cada campo
  const FieldRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 2, py: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {value}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Mi Legajo</Typography>
      <Paper elevation={2} sx={{ p: 3, maxWidth: 1100, margin: '0 auto' }}>
        <Grid container spacing={3}>
          {/* Sección: Datos Personales */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, pb: 1, borderBottom: '2px solid #1976d2' }}>
              Datos Personales
            </Typography>
            <FieldRow label="Nombre" value={legajo.nombre && legajo.apellido ? `${legajo.nombre} ${legajo.apellido}` : legajo.nombre} />
            <FieldRow label="DNI" value={legajo.nro_documento} />
            <FieldRow label="Tipo Documento" value={legajo.tipo_documento} />
            <FieldRow label="CUIL" value={legajo.cuil} />
            <FieldRow label="Fecha de Nacimiento" value={formatFecha(legajo.fecha_nacimiento)} />
            <FieldRow label="Sexo" value={legajo.sexo} />
            <FieldRow label="Nacionalidad" value={legajo.nacionalidad} />
            <FieldRow label="Estado Civil" value={legajo.estado_civil} />
          </Grid>

          {/* Sección: Datos de Contacto */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, pb: 1, borderBottom: '2px solid #388e3c' }}>
              Datos de Contacto
            </Typography>
            <FieldRow label="Domicilio" value={legajo.domicilio} />
            <FieldRow label="Localidad" value={legajo.localidad} />
            <FieldRow label="Provincia" value={legajo.provincia} />
            <FieldRow label="Código Postal" value={legajo.codigo_postal} />
            <FieldRow label="Teléfono" value={legajo.telefono_contacto} />
            <FieldRow label="Contacto Emergencia" value={legajo.contacto_emergencia} />
          </Grid>

          {/* Sección: Datos Laborales */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, pb: 1, borderBottom: '2px solid #f57c00' }}>
              Datos Laborales
            </Typography>
            <FieldRow label="Legajo" value={legajo.legajo} />
            <FieldRow label="Fecha de Ingreso" value={formatFecha(legajo.fecha_ingreso)} />
            <FieldRow label="Tarea" value={legajo.tarea_desempenada} />
            <FieldRow label="Centro de Costos" value={legajo.centro_costos} />
          </Grid>

          {/* Sección: Datos Bancarios */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, pb: 1, borderBottom: '2px solid #7b1fa2' }}>
              Datos Bancarios
            </Typography>
            <FieldRow label="Banco" value={legajo.banco_destino} />
            <FieldRow label="Cuenta Bancaria" value={legajo.cuenta_bancaria} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          Si algún dato es incorrecto, comunícate con RRHH.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Legajo;
