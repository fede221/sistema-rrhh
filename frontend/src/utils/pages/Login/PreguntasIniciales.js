import { API_BASE_URL } from '../../../config';
// src/pages/Login/PreguntasIniciales.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import secureStorage from '../../secureStorage';

const PreguntasIniciales = () => {
  const navigate = useNavigate();
  const userId = secureStorage.getItem('userId');
  const [preguntas, setPreguntas] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState(Array(7).fill(''));
  const [respuestas, setRespuestas] = useState(Array(7).fill(''));
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchPreguntas = async () => {
      try {
  const res = await axios.get(`${API_BASE_URL}/preguntas/listado`);
        setPreguntas(res.data);
      } catch (error) {
        console.error('Error al traer las preguntas', error);
      }
    };

    fetchPreguntas();
  }, []);

  const handleSelectChange = (index, value) => {
    const nuevas = [...seleccionadas];
    nuevas[index] = value;
    setSeleccionadas(nuevas);
  };

  const handleRespuestaChange = (index, value) => {
    const nuevas = [...respuestas];
    nuevas[index] = value;
    setRespuestas(nuevas);
  };

 const handleGuardar = async () => {
  if (seleccionadas.includes('') || respuestas.includes('')) {
    return setSnackbar({ open: true, message: 'Completá todas las preguntas y respuestas', severity: 'error' });
  }

  // Verificar que las preguntas no estén repetidas
  const preguntasUnicas = new Set(seleccionadas);
  if (preguntasUnicas.size !== seleccionadas.length) {
    return setSnackbar({ open: true, message: 'No podés repetir preguntas', severity: 'error' });
  }

  try {
    const payload = seleccionadas.map((pregunta_id, i) => ({
      pregunta_id,
      respuesta: respuestas[i]
    }));

  await axios.post(`${API_BASE_URL}/preguntas/cargar-preguntas/${userId}`, payload);
    setSnackbar({ open: true, message: '✅ Preguntas guardadas correctamente', severity: 'success' });

    // Obtener el rol del usuario para redirigir correctamente
    const userRol = secureStorage.getItem('userRol');
    
    setTimeout(() => {
      if (userRol === 'empleado') {
        navigate('/bienvenida'); // Empleados van a la pantalla de bienvenida
      } else {
        navigate('/dashboard'); // Otros roles van al dashboard
      }
    }, 1500);
  } catch (error) {
    console.error('Error al guardar preguntas', error);
    setSnackbar({ open: true, message: '❌ Error al guardar preguntas', severity: 'error' });
  }
};


  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 5 }}>
      <Typography variant="h5" gutterBottom>Configuración de Preguntas de Seguridad</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Para completar la configuración de tu cuenta, necesitas establecer 7 preguntas de seguridad. 
        Estas preguntas te ayudarán a recuperar tu cuenta en caso de olvido de contraseña.
      </Typography>

      {Array.from({ length: 7 }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Pregunta {index + 1}</InputLabel>
            <Select
              value={seleccionadas[index]}
              label={`Pregunta ${index + 1}`}
              onChange={(e) => handleSelectChange(index, e.target.value)}
            >
              {preguntas.map((pregunta) => (
               <MenuItem key={pregunta.id} value={pregunta.id}>{pregunta.pregunta}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Respuesta"
            fullWidth
            value={respuestas[index]}
            onChange={(e) => handleRespuestaChange(index, e.target.value)}
          />
        </Box>
      ))}

      <Button variant="contained" color="primary" onClick={handleGuardar}>
        Guardar Preguntas
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PreguntasIniciales;
