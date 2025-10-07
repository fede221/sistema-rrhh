import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { getUser } from '../utils/auth';

const usePermisos = () => {
  const [permisos, setPermisos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermisos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const data = await apiRequest('/api/permisos/usuario');

        if (data && data.data) {
          setPermisos(data.data);
        } else {
          console.error('Error al obtener permisos - datos inválidos');
          setError('Error al obtener permisos');
          
          // Como respaldo, usar el rol del localStorage
          const user = getUser();
          if (user) {
            setPermisos({ rol: user.rol, permisos: {} });
          }
        }
      } catch (error) {
        console.error('Error al obtener permisos:', error);
        setError('Error al obtener permisos');
        
        // Como respaldo, usar el rol del localStorage
        const user = getUser();
        if (user) {
          setPermisos({ rol: user.rol, permisos: {} });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPermisos();
  }, []);

  // Función para verificar si el usuario tiene un permiso específico
  const tienePermiso = (modulo, permiso) => {
    // Superadmin tiene todos los permisos
    if (permisos.rol === 'superadmin') {
      return true;
    }
    
    if (!permisos.permisos || !permisos.permisos[modulo]) {
      return false;
    }
    return permisos.permisos[modulo].includes(permiso);
  };

  // Función para verificar si el usuario tiene cualquier permiso en un módulo
  const tienePermisoEnModulo = (modulo) => {
    // Superadmin tiene todos los permisos
    if (permisos.rol === 'superadmin') {
      return true;
    }
    
    return permisos.permisos && permisos.permisos[modulo] && permisos.permisos[modulo].length > 0;
  };

  // Función para verificar si es superadmin
  const esSuperAdmin = () => {
    return permisos.rol === 'superadmin';
  };

  // Función para verificar si es admin RRHH
  const esAdminRRHH = () => {
    return permisos.rol === 'admin_rrhh' || permisos.rol === 'superadmin';
  };

  // Función para verificar si es referente
  const esReferente = () => {
    return permisos.rol === 'referente';
  };

  return {
    permisos: permisos.permisos || {},
    rol: permisos.rol,
    loading,
    error,
    tienePermiso,
    tienePermisoEnModulo,
    esSuperAdmin,
    esAdminRRHH,
    esReferente
  };
};

export default usePermisos;