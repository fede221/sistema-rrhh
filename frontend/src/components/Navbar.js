import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  BeachAccess as VacacionesIcon,
  Work as WorkIcon,
  Error as ErrorIcon,
  Security as SecurityIcon,
  MonitorHeart as MonitorIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import { getUser, clearAuthData } from '../utils/auth';
import usePermisos from '../hooks/usePermisos';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const { tienePermiso, esSuperAdmin, loading } = usePermisos();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verificar si está en el flujo de preguntas iniciales
  const enPreguntasIniciales = location.pathname === '/preguntas-iniciales';

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Definir los elementos del menú
  const getMenuItems = () => {
    const items = [];

    if (!enPreguntasIniciales) {
      // Inicio/Dashboard según el rol
      if (user.rol === 'empleado') {
        items.push({
          text: 'INICIO',
          path: '/bienvenida',
          icon: <HomeIcon />,
          show: true
        });
      } else if (tienePermiso('dashboard', 'ver')) {
        items.push({
          text: 'DASHBOARD',
          path: '/dashboard',
          icon: <DashboardIcon />,
          show: true
        });
      }

      // Usuarios
      if (tienePermiso('usuarios', 'ver')) {
        items.push({
          text: 'USUARIOS',
          path: '/usuarios',
          icon: <PeopleIcon />,
          show: true
        });
      }

      // Legajo para empleados
      if (tienePermiso('legajo', 'ver_propio')) {
        items.push({
          text: 'LEGAJO',
          path: '/legajos',
          icon: <AssignmentIcon />,
          show: true
        });
      }

      // Legajos para admin
      if (tienePermiso('legajos', 'ver_todos')) {
        items.push({
          text: 'LEGAJOS',
          path: '/legajos',
          icon: <AssignmentIcon />,
          show: true
        });
      }

      // Recibos
      if (tienePermiso('recibos', 'ver_propios') || tienePermiso('recibos', 'ver')) {
        items.push({
          text: 'RECIBOS',
          path: '/recibos',
          icon: <ReceiptIcon />,
          show: true
        });
      }

      // Vacaciones
      if (tienePermiso('vacaciones', 'ver_propias') || tienePermiso('vacaciones', 'ver')) {
        items.push({
          text: 'VACACIONES',
          path: '/vacaciones',
          icon: <VacacionesIcon />,
          show: true
        });
      }

      // Mi Equipo
      if (tienePermiso('usuarios', 'ver_equipo') || tienePermiso('legajos', 'ver_equipo') || tienePermiso('recibos', 'ver_equipo')) {
        items.push({
          text: 'MI EQUIPO',
          path: '/mi-equipo',
          icon: <WorkIcon />,
          show: true
        });
      }

      // Solo superadmin
      if (esSuperAdmin()) {
        items.push(
          {
            text: 'ERRORES',
            path: '/errores',
            icon: <ErrorIcon />,
            show: true
          },
          {
            text: 'PERMISOS',
            path: '/permisos',
            icon: <SecurityIcon />,
            show: true
          },
          {
            text: '+ PERMISOS',
            path: '/permisos/nuevos',
            icon: <SecurityIcon />,
            show: true
          },
          {
            text: 'MONITOREO',
            path: '/monitoring',
            icon: <MonitorIcon />,
            show: true
          }
        );
      }
    }

    return items.filter(item => item.show);
  };

  if (!user || loading) return null;

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#1976d2',
          height: '70px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar
          sx={{
            minHeight: '70px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Sección izquierda: Logo y menú hamburguesa en móvil */}
          <Box sx={{ display: 'flex', alignItems: 'center', pl: isMobile ? 1 : 2 }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={toggleMobileMenu}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              color="inherit"
              sx={{ 
                fontWeight: 'bold',
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              Sistema RRHH
            </Typography>
          </Box>

          {/* Sección central: Menú en desktop */}
          {!isMobile && !enPreguntasIniciales && (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              {getMenuItems().map((item) => (
                <Button 
                  key={item.path}
                  component={Link} 
                  to={item.path}
                  sx={{
                    color: 'white',
                    height: '100%',
                    borderRadius: 0,
                    px: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {/* Mensaje informativo cuando está en preguntas iniciales */}
          {enPreguntasIniciales && !isMobile && (
            <Box sx={{ color: 'white', textAlign: 'center', flex: 1 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                Completá las preguntas de seguridad para continuar
              </Typography>
            </Box>
          )}

          {/* Sección derecha: Usuario y logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {/* Info del usuario */}
            <Box 
              sx={{ 
                backgroundColor: '#015f92',
                height: '70px',
                display: 'flex', 
                alignItems: 'center', 
                color: 'white',
                px: isMobile ? 1 : 2,
                minWidth: isMobile ? 'auto' : '200px'
              }}
            >
              <AccountCircleIcon sx={{ mr: isMobile ? 0.5 : 1 }} />
              <Typography 
                variant="body2"
                sx={{ 
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  maxWidth: isMobile ? '100px' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {isMobile ? (user.displayName || user.nombreCompleto).split(' ')[0] : (user.displayName || user.nombreCompleto)}
              </Typography>
            </Box>

            {/* Botón cerrar sesión */}
            <Box
              sx={{
                backgroundColor: 'red',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Button
                startIcon={!isMobile ? <LogoutIcon sx={{ color: 'white' }} /> : null}
                sx={{
                  color: 'white',
                  height: '100%',
                  borderRadius: 0,
                  px: isMobile ? 1 : 2,
                  minWidth: 'auto',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  '&:hover': {
                    backgroundColor: '#b30000',
                  },
                }}
                onClick={handleLogout}
              >
                {isMobile ? <LogoutIcon /> : 'CERRAR SESIÓN'}
              </Button>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer para menú móvil */}
          <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: '#f5f5f5',
            pt: 2
          }
        }}
      >
          <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
            Sistema RRHH
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.displayName || user.nombreCompleto}
          </Typography>
        </Box>
        
        <Divider />
        
        <List>
          {enPreguntasIniciales ? (
            <ListItem>
              <ListItemText 
                primary="Completá las preguntas de seguridad"
                primaryTypographyProps={{ 
                  variant: 'body2', 
                  style: { fontStyle: 'italic' } 
                }}
              />
            </ListItem>
          ) : (
            getMenuItems().map((item) => (
              <ListItemButton 
                key={item.path}
                component={Link} 
                to={item.path}
                onClick={closeMobileMenu}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: '#e3f2fd'
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#1976d2', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{ 
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
