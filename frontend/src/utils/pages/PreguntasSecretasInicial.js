import { API_BASE_URL } from '../../config';
// src/pages/PreguntasSecretasInicial.js
import React, { useEffect, useState } from 'react';
import {
  Typography, TextField, Button, Box, MenuItem
} from '@mui/material';
import axios from 'axios';

const PreguntasSecretasInicial = () => {
  const [preguntasDisponibles, setPreguntasDisponibles] = useState([]);
  const [respuestas, setRespuestas] = useState(Array(7).fill({ pregunta_id: '', respuesta: '' }));

  useEffect(() => {
    const fetchPreguntas = async () => {
      let token = localStorage.getItem('token');
      try {
        token = JSON.parse(token)?.value || token;
      } catch {}
  const res = await axios.get(`${API_BASE_URL}/preguntas/preguntas-secretas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreguntasDisponibles(res.data);
    };
    fetchPreguntas();
  }, []);

  const handleChange = (index, field, value) => {
    const nuevas = [...respuestas];
    nuevas[index] = { ...nuevas[index], [field]: value };
    setRespuestas(nuevas);
  };

  const handleGuardar = async () => {
    let token = localStorage.getItem('token');
    try {
      token = JSON.parse(token)?.value || token;
    } catch {}
    try {
  await axios.post(`${API_BASE_URL}/preguntas/guardar-respuestas`, { respuestas }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Preguntas guardadas correctamente');
      window.location.href = '/dashboard';
    } catch (err) {
      if (err.response && err.response.status === 403) {
        alert('Tu sesión expiró o no tienes permisos. Volvé a iniciar sesión.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('Error al guardar preguntas: ' + (err.message || '')); 
        // Opcional: log para debug
        // console.error(err);
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 5 }}>
      <Typography variant="h5" gutterBottom>Configurá tus 7 preguntas secretas</Typography>
      {respuestas.map((r, i) => (
        <Box key={i} sx={{ mb: 2 }}>
          <TextField
            select label={`Pregunta ${i + 1}`} fullWidth margin="dense"
            value={r.pregunta_id}
            onChange={(e) => handleChange(i, 'pregunta_id', e.target.value)}
          >
            {preguntasDisponibles.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.pregunta || p.texto}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Respuesta"
            fullWidth
            value={r.respuesta}
            onChange={(e) => handleChange(i, 'respuesta', e.target.value)}
          />
        </Box>
      ))}
      <Button variant="contained" onClick={handleGuardar}>Guardar preguntas</Button>
    </Box>
  );
};

export default PreguntasSecretasInicial;
