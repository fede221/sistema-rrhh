// src/App.js
import React from 'react';
import { getToken, getUser } from './utils/auth';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import SessionManager from './components/SessionManager';
import Usuarios from './pages/Usuarios/Usuarios';
import Vacaciones from './pages/Vacaciones/Vacaciones';
import Recibos from './pages/Recibos/Recibos';
import GestionEmpresas from './pages/Recibos/GestionEmpresas';
import Legajo from './pages/Legajo/Legajo'; 
import ResetPassword from './pages/Login/ResetPassword';
import PreguntasIniciales from './pages/Login/PreguntasIniciales';
import MiEquipo from './pages/MiEquipo';
import BienvenidaEmpleado from './pages/BienvenidaEmpleado';
import InstallPWA from './components/InstallPWA';
import MobileAppWrapper from './components/MobileAppWrapper';
import FullscreenMobile from './components/FullscreenMobile';
import './App.css';
import './styles/responsive.css';
import RequireAuth from './components/RequireAuth'; 
import LegajoEmpleado from './pages/Legajo/LegajoEmpleado';
import LegajoAdmin from './pages/Legajo/LegajoAdmin';
import ErroresLog from './pages/ErroresLog';
import GestionPermisos from './pages/GestionPermisos';
import GestionPermisosNuevos from './pages/GestionPermisosNuevos';
import MonitoringDashboard from './pages/Admin/MonitoringDashboard';



const AppLayout = () => {
  const location = useLocation();
  const token = getToken();
  const user = getUser();

  const showNavbar = token && location.pathname !== '/login';

  return (
    <MobileAppWrapper>
      {showNavbar && <Navbar />}
      {token && <SessionManager />}
      <div 
        style={{ 
          marginTop: showNavbar ? '70px' : '0',
          minHeight: showNavbar ? 'calc(100vh - 70px)' : '100vh',
          width: '100%',
          overflowX: 'hidden'
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              token ? (
                user?.rol === 'empleado' ? 
                <Navigate to="/bienvenida" replace /> : 
                <Dashboard />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/bienvenida" 
            element={
              token && user?.rol === 'empleado' ? 
              <BienvenidaEmpleado /> : 
              <Navigate to="/dashboard" />
            } 
          />
          <Route path="/usuarios" element={token ? <Usuarios /> : <Navigate to="/login" />} />
          <Route path="/vacaciones" element={token ? <Vacaciones /> : <Navigate to="/login" />} />
          <Route path="/recibos" element={token ? <Recibos /> : <Navigate to="/login" />} />
          <Route 
            path="/recibos/empresas" 
            element={
              token && user?.rol && ['admin', 'superadmin', 'admin_rrhh'].includes(user.rol) ? 
              <GestionEmpresas /> : 
              <Navigate to="/login" />
            } 
          />
        <Route 
          path="/legajo"
          element={
            token ? (
              user?.rol === 'empleado' ? (
                <LegajoEmpleado />
              ) : (
                <Legajo />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/preguntas-iniciales" element={<PreguntasIniciales />} />
        <Route 
          path="/" 
          element={
            token ? (
              user?.rol === 'empleado' ? 
              <Navigate to="/bienvenida" replace /> : 
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="*" 
          element={
            token ? (
              user?.rol === 'empleado' ? 
              <Navigate to="/bienvenida" replace /> : 
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/legajos-admin" element={
        <RequireAuth allowedRoles={['admin_rrhh', 'superadmin']}>
        <LegajoAdmin />
        </RequireAuth>
} />
        <Route path="/errores-log" element={
          token && user?.rol === 'superadmin' ? <ErroresLog /> : <Navigate to="/login" />
        } />
        <Route path="/permisos" element={
          token && user?.rol === 'superadmin' ? <GestionPermisos /> : <Navigate to="/login" />
        } />
        <Route path="/permisos/nuevos" element={
          token && user?.rol === 'superadmin' ? <GestionPermisosNuevos /> : <Navigate to="/login" />
        } />
        <Route path="/monitoring" element={
          token && user?.rol === 'superadmin' ? <MonitoringDashboard /> : <Navigate to="/login" />
        } />
        <Route path="/mi-equipo" element={
          token && (user?.rol === 'referente' || user?.rol === 'superadmin') ? <MiEquipo /> : <Navigate to="/login" />
        } />
        </Routes>
      </div>
      <InstallPWA />
      <FullscreenMobile />
    </MobileAppWrapper>
  );
};

const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;
