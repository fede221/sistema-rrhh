import { API_BASE_URL } from '../../config';
// src/pages/RecuperarPassword.js
import React, { useEffect, useState } from 'react';
import {
  Typography, TextField, Button, Box
} from '@mui/material';
import axios from 'axios';

const RecuperarPassword = () => {
  const [dni, setDni] = useState('');
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [nuevaPassword, setNuevaPassword] = useState('');

  const handleBuscarPreguntas = async () => {
  const res = await axios.get(`${API_BASE_URL}/preguntas/aleatorias/${dni}`);
    setPreguntas(res.data);
  };

  const handleSubmit = async () => {
    try {
  const res = await axios.post(`${API_BASE_URL}/preguntas/verificar`, {
        dni,
        respuestas,
        nuevaPassword
      });
      alert('✅ Contraseña actualizada');
      window.location.href = '/login';
    } catch (err) {
      alert('❌ Respuestas incorrectas');
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 5 }}>
      <Typography variant="h5" gutterBottom>Recuperar Contraseña</Typography>
      <TextField
        label="DNI"
        fullWidth margin="normal"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
      />
      <Button variant="outlined" onClick={handleBuscarPreguntas}>Buscar Preguntas</Button>

      {preguntas.map((p) => (
        <TextField
          key={p.id}
          label={p.texto}
          fullWidth margin="normal"
          onChange={(e) => setRespuestas({ ...respuestas, [p.id]: e.target.value })}
        />
      ))}

      {preguntas.length > 0 && (
        <>
          <TextField
            label="Nueva contraseña"
            type="password"
            fullWidth margin="normal"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
          />
          <Button variant="contained" onClick={handleSubmit}>Cambiar contraseña</Button>
        </>
      )}
    </Box>
  );
};

export default RecuperarPassword;
