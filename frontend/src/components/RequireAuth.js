// src/components/RequireAuth.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, getUser } from '../utils/auth';

const RequireAuth = ({ children, allowedRoles }) => {
  const token = getToken();
  const user = getUser(); // { id, rol, ... }

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default RequireAuth;
