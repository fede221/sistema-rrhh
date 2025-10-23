import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const Version = () => {
  // Leer versión desde el archivo version.json
  const version = process.env.REACT_APP_VERSION || '1.2.0';
  const buildDate = process.env.REACT_APP_BUILD_DATE || '2025-10-23';
  const environment = process.env.REACT_APP_ENV || 'production';

  // Determinar color según el ambiente
  const getEnvColor = () => {
    switch (environment) {
      case 'production':
        return '#4caf50'; // Verde
      case 'staging':
        return '#ff9800'; // Naranja
      case 'development':
        return '#2196f3'; // Azul
      default:
        return '#757575'; // Gris
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        padding: '6px 12px',
        borderRadius: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.1)',
        zIndex: 1000,
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }
      }}
    >
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Sistema RRHH - DB Consulting
            </Typography>
            <Typography variant="caption" display="block">
              Versión: {version}
            </Typography>
            <Typography variant="caption" display="block">
              Fecha: {buildDate}
            </Typography>
            <Typography variant="caption" display="block">
              Ambiente: {environment}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              © 2025 DEF - Software Solutions
            </Typography>
          </Box>
        }
        arrow
        placement="top"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
          <InfoOutlinedIcon sx={{ fontSize: 16, color: getEnvColor() }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: '#424242',
              fontSize: '0.75rem',
              letterSpacing: '0.5px'
            }}
          >
            v{version}
          </Typography>
          {environment !== 'production' && (
            <Box
              sx={{
                fontSize: '0.65rem',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: getEnvColor(),
                padding: '2px 6px',
                borderRadius: '8px',
                textTransform: 'uppercase',
                ml: 0.5
              }}
            >
              {environment}
            </Box>
          )}
        </Box>
      </Tooltip>
    </Box>
  );
};

export default Version;
