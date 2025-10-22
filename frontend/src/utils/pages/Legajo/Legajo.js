import React, { useEffect, useState } from 'react';
import { Typography, Box, Paper, Grid, Divider } from '@mui/material';
import { getUser } from '../../auth';
import { apiRequest } from '../../api';

const Legajo = () => {
  const [legajo, setLegajo] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser && getUser();

  useEffect(() => {
    const fetchLegajo = async () => {
      try {
        const data = await apiRequest('/usuarios/mi-legajo');
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Mi Legajo</Typography>
      <Paper elevation={3} sx={{ p: 2, maxWidth: 1100, margin: '0 auto', overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          {legajo.domicilio && <span><b>Domicilio:</b> {legajo.domicilio}</span>}
          {legajo.localidad && <span><b>Localidad:</b> {legajo.localidad}</span>}
          {legajo.fecha_nacimiento && <span><b>Fecha de nacimiento:</b> {formatFecha(legajo.fecha_nacimiento)}</span>}
          {legajo.cuil && <span><b>CUIL:</b> {legajo.cuil}</span>}
          {legajo.centro_costos && <span><b>Centro de costos:</b> {legajo.centro_costos}</span>}
          {legajo.tarea_desempenada && <span><b>Tarea:</b> {legajo.tarea_desempenada}</span>}
          {legajo.legajo && <span><b>Legajo:</b> {legajo.legajo}</span>}
          {legajo.nro_documento && <span><b>DNI:</b> {legajo.nro_documento}</span>}
          {legajo.nombre && legajo.apellido && <span><b>Nombre:</b> {legajo.nombre} {legajo.apellido}</span>}
          {legajo.fecha_ingreso && <span><b>Fecha de ingreso:</b> {formatFecha(legajo.fecha_ingreso)}</span>}
          {legajo.codigo_postal && <span><b>Código Postal:</b> {legajo.codigo_postal}</span>}
          {legajo.telefono_contacto && <span><b>Teléfono:</b> {legajo.telefono_contacto}</span>}
          {legajo.contacto_emergencia && <span><b>Contacto Emergencia:</b> {legajo.contacto_emergencia}</span>}
          {legajo.estado_civil && <span><b>Estado Civil:</b> {legajo.estado_civil}</span>}
          {legajo.cuenta_bancaria && <span><b>Cuenta Bancaria:</b> {legajo.cuenta_bancaria}</span>}
          {legajo.banco_destino && <span><b>Banco:</b> {legajo.banco_destino}</span>}
          {legajo.sexo && <span><b>Sexo:</b> {legajo.sexo}</span>}
          {legajo.tipo_documento && <span><b>Tipo Documento:</b> {legajo.tipo_documento}</span>}
          {legajo.nacionalidad && <span><b>Nacionalidad:</b> {legajo.nacionalidad}</span>}
          {legajo.provincia && <span><b>Provincia:</b> {legajo.provincia}</span>}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">Si algún dato es incorrecto, comunicate con RRHH.</Typography>
      </Paper>
    </Box>
  );
};

export default Legajo;
