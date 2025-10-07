import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Pagination, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const ErroresLog = () => {
  const [errores, setErrores] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalDetalles, setModalDetalles] = useState({ open: false, error: null });
  const limit = 50;

  const fetchErrores = async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/errores?limit=${limit}&offset=${(pageNum-1)*limit}`);
      setErrores(data);
      setPage(pageNum);
    } catch (error) {
      console.error('Error al cargar errores:', error);
      setErrores([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchErrores(1);
  }, []);

  const columns = [
    { 
      field: 'fecha', 
      headerName: '📅 Fecha', 
      width: 180, 
      valueGetter: (params) => (params && params.row && params.row.fecha) ? new Date(params.row.fecha).toLocaleString() : '-',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'usuario_id', 
      headerName: '👤 Usuario', 
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ borderRadius: 2, fontSize: '0.75rem' }}
        />
      )
    },
    { 
      field: 'usuario_rol', 
      headerName: '🎭 Rol', 
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          color="secondary"
          variant="outlined"
          size="small"
          sx={{ borderRadius: 2, fontSize: '0.75rem' }}
        />
      )
    },
    { 
      field: 'ip', 
      headerName: '🌐 IP', 
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    { 
      field: 'endpoint', 
      headerName: '🔗 Endpoint', 
      width: 220,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          fontSize: '0.8rem', 
          fontFamily: 'monospace',
          color: 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    { 
      field: 'mensaje', 
      headerName: '⚠️ Mensaje', 
      width: 300,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          fontSize: '0.85rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'error.main'
        }}>
          {params.value || 'Sin mensaje'}
        </Typography>
      )
    },
    { 
      field: 'detalles', 
      headerName: '🔍 Detalles', 
      width: 100, 
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ver detalles del error">
          <IconButton
            size="small"
            color="info"
            onClick={() => setModalDetalles({ open: true, error: params.row })}
            sx={{
              bgcolor: 'info.50',
              '&:hover': { bgcolor: 'info.100' }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Log de Errores del Sistema</Typography>
      <Box sx={{ height: 600, width: '100%', background: 'white', borderRadius: 2, boxShadow: 1 }}>
        <DataGrid
          rows={errores}
          columns={columns}
          getRowId={row => row.id}
          pageSize={limit}
          rowsPerPageOptions={[limit]}
          loading={loading}
          disableSelectionOnClick
          autoHeight={false}
        />
      </Box>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={10} page={page} onChange={(_, val) => fetchErrores(val)} />
      </Box>
    </Box>
  );
};

export default ErroresLog;
