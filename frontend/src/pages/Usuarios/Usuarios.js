import React, { useEffect, useState, useRef } from 'react';
import secureStorage from '../../utils/secureStorage';
import { apiRequest } from '../../utils/api';
import {
  DataGrid
} from '@mui/x-data-grid';
import {
  Button, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Input, Alert, List, ListItem, ListItemText, Accordion,
  AccordionSummary, AccordionDetails, LinearProgress, IconButton, ListItemIcon,
  Popper, Paper, ClickAwayListener
} from '@mui/material';
import { 
  ExpandMore, 
  Upload, 
  Download, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  CheckCircleOutline,
  Cancel as CancelIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';




const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [referentes, setReferentes] = useState([]);
  const [openCrear, setOpenCrear] = useState(false);
  const [openImportar, setOpenImportar] = useState(false);
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [datosImportar, setDatosImportar] = useState([]);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  const [columnasDetectadas, setColumnasDetectadas] = useState([]);
  // Estados para la barra de progreso
  const [progresoImportacion, setProgresoImportacion] = useState(0);
  const [totalImportacion, setTotalImportacion] = useState(0);
  const [importandoEnProgreso, setImportandoEnProgreso] = useState(false);
  
  // Estados para importación de datos adicionales
  const [openImportarDatos, setOpenImportarDatos] = useState(false);
  const [archivoExcelDatos, setArchivoExcelDatos] = useState(null);
  const [datosAdicionales, setDatosAdicionales] = useState([]);
  const [resultadoDatos, setResultadoDatos] = useState(null);
  // Estados para la barra de progreso de datos adicionales
  const [progresoDatos, setProgresoDatos] = useState(0);
  const [totalDatos, setTotalDatos] = useState(0);
  const [importandoDatos, setImportandoDatos] = useState(false);
  
  const [nuevoUsuario, setNuevoUsuario] = useState({
  legajo: '',
  dni: '',
  nombre: '',
  apellido: '',
  correo: '',
  password: '',
  rol: 'empleado',
  cuil: '',
  fecha_nacimiento: '',
  referente_id: '',
  convenio: 'dentro'
});

// Estado para checklist de contraseña
const [passwordChecks, setPasswordChecks] = useState({
  length: false,
  upper: false,
  lower: false,
  number: false,
  special: false
});

const evaluatePassword = (pw) => {
  const length = pw.length >= 6; // keep 6 to match existing frontend validation
  const upper = /[A-Z]/.test(pw);
  const lower = /[a-z]/.test(pw);
  const number = /[0-9]/.test(pw);
  const special = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
  return { length, upper, lower, number, special };
};

// Anchor ref and visibility state for floating checklist
const passwordAnchorRef = useRef(null);
const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);
const editPasswordAnchorRef = useRef(null);

  const fetchUsuarios = async () => {
    try {
      const data = await apiRequest('/api/usuarios');
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const fetchReferentes = async () => {
    try {
      const data = await apiRequest('/api/usuarios');
      const referentesData = data.filter(user => user.rol === 'referente');
      setReferentes(referentesData);
    } catch (error) {
      console.error('Error al cargar referentes:', error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchReferentes();
  }, []);

  const handleCrearUsuario = async () => {
    // Validación de campos obligatorios con mensajes específicos
    const validaciones = [
      { campo: 'legajo', valor: nuevoUsuario.legajo, mensaje: 'Legajo es obligatorio' },
      { campo: 'dni', valor: nuevoUsuario.dni, mensaje: 'DNI es obligatorio' },
      { campo: 'nombre', valor: nuevoUsuario.nombre, mensaje: 'Nombre es obligatorio' },
      { campo: 'apellido', valor: nuevoUsuario.apellido, mensaje: 'Apellido es obligatorio' },
      { campo: 'correo', valor: nuevoUsuario.correo, mensaje: 'Correo electrónico es obligatorio' },
      { campo: 'password', valor: nuevoUsuario.password, mensaje: 'Contraseña es obligatoria' },
      { campo: 'rol', valor: nuevoUsuario.rol, mensaje: 'Rol es obligatorio' }
    ];

    // Verificar campos obligatorios
    for (let validacion of validaciones) {
      if (!validacion.valor || String(validacion.valor).trim().length === 0) {
        alert(`❌ ${validacion.mensaje}`);
        return;
      }
    }

    // Validaciones adicionales de formato
    const dni = String(nuevoUsuario.dni).trim();
    if (!/^\d{7,8}$/.test(dni)) {
      alert('❌ DNI debe contener entre 7 y 8 dígitos numéricos');
      return;
    }

    const correo = String(nuevoUsuario.correo).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      alert('❌ Formato de correo electrónico inválido');
      return;
    }

    const password = String(nuevoUsuario.password).trim();
    if (password.length < 6) {
      alert('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevoUsuario.cuil && !/^\d{11}$/.test(String(nuevoUsuario.cuil).trim())) {
      alert('❌ CUIL debe contener exactamente 11 dígitos numéricos');
      return;
    }

    try {
      const response = await apiRequest('/api/usuarios', {
        method: 'POST',
        body: JSON.stringify(nuevoUsuario)
      });
      
      // Mostrar mensaje de éxito con detalles
      if (response.mensaje) {
        alert(`✅ ${response.mensaje}\n📝 Legajo: ${response.legajo}\n👤 Usuario: ${response.nombre}\n🆔 ID: ${response.id}`);
      } else {
        alert('✅ Usuario creado exitosamente');
      }
      
      setOpenCrear(false);
      setNuevoUsuario({
        legajo: '',
        dni: '',
        nombre: '',
        apellido: '',
        correo: '',
        password: '',
        rol: 'empleado',
        cuil: '',
        fecha_nacimiento: '',
        referente_id: ''
      });
      fetchUsuarios(); // refresca la tabla
    } catch (err) {
      if (err.response && err.response.data) {
        console.error('Error al crear usuario:', err.response.data);
        
        const errorData = err.response.data;
        const errorMsg = errorData.error;
        const fieldName = errorData.field;
        const errorType = errorData.type;
        
        let mensajeMostrar = `❌ Error al crear usuario:\n\n${errorMsg}`;
        
        // Agregar sugerencias específicas basadas en el tipo de error y campo
        if (errorType === 'DUPLICATE_FIELD') {
          switch (fieldName) {
            case 'dni':
              mensajeMostrar += '\n\n💡 Sugerencia: El DNI ya está registrado en el sistema. Verifique que no exista otro usuario con este documento.';
              break;
            case 'legajo':
              mensajeMostrar += '\n\n💡 Sugerencia: El número de legajo ya está en uso. Elija un número de legajo diferente.';
              break;
            case 'correo':
              mensajeMostrar += '\n\n💡 Sugerencia: El correo electrónico ya está registrado. Use un email diferente.';
              break;
            default:
              mensajeMostrar += '\n\n💡 Sugerencia: Verifique que los datos no estén duplicados en el sistema.';
          }
        } else if (errorType === 'CONNECTION_ERROR') {
          mensajeMostrar = '❌ Error de conexión con la base de datos.\n\n💡 Sugerencias:\n• Verifique su conexión a internet\n• Compruebe que el servidor esté funcionando\n• Intente nuevamente en unos minutos';
        } else if (errorType === 'VALIDATION_ERROR') {
          mensajeMostrar += '\n\n💡 Sugerencia: Verifique que todos los campos cumplan con los formatos requeridos.';
        } else if (errorType === 'PERMISSION_ERROR') {
          mensajeMostrar = '❌ Error de permisos en la base de datos.\n\n💡 Sugerencia: Contacte al administrador del sistema.';
        } else {
          // Fallback para errores que contengan palabras clave específicas
          if (errorMsg.includes('DNI')) {
            mensajeMostrar += '\n\n💡 Sugerencia: Verifique que el DNI no esté duplicado y tenga el formato correcto (7-8 dígitos)';
          } else if (errorMsg.includes('legajo')) {
            mensajeMostrar += '\n\n💡 Sugerencia: Verifique que el legajo no esté duplicado y tenga el formato correcto';
          } else if (errorMsg.includes('correo')) {
            mensajeMostrar += '\n\n💡 Sugerencia: Verifique que el correo no esté duplicado y tenga un formato válido';
          } else if (errorMsg.includes('contraseña') || errorMsg.includes('password')) {
            mensajeMostrar += '\n\n💡 Sugerencia: La contraseña debe tener al menos 6 caracteres';
          }
        }
        
        alert(mensajeMostrar);
      } else if (err.response && err.response.status === 503) {
        console.error('Error de servicio no disponible:', err);
        alert('❌ El servicio no está disponible temporalmente.\n\n💡 Sugerencias:\n• Verifique su conexión a internet\n• El servidor puede estar en mantenimiento\n• Intente nuevamente en unos minutos');
      } else if (err.response && err.response.status === 500) {
        console.error('Error interno del servidor:', err);
        alert('❌ Error interno del servidor.\n\n💡 Sugerencias:\n• Verifique la conexión a la base de datos\n• Los permisos del usuario\n• El formato de los datos\n• Contacte al administrador si el problema persiste');
      } else {
        console.error('Error inesperado:', err);
        alert('❌ Error inesperado al crear usuario.\n\n💡 Sugerencia: Verifique su conexión a internet e inténtelo nuevamente.');
      }
    }
  };



  const handleEliminarUsuario = async (usuario) => {
  const confirm = window.confirm(`¿Estás seguro de que querés eliminar a ${usuario.nombre} ${usuario.apellido}?\n\n⚠️ Esta acción no se puede deshacer.`);
  if (!confirm) return;

  try {
    await apiRequest(`/api/usuarios/${usuario.id}`, {
      method: 'DELETE'
    });
    setUsuarios(usuarios.filter(u => u.id !== usuario.id));
    alert(`✅ Usuario ${usuario.nombre} ${usuario.apellido} eliminado correctamente`);
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    
    if (error.response && error.response.data && error.response.data.error) {
      const errorMsg = error.response.data.error;
      let mensajeMostrar = `❌ Error al eliminar usuario:\n\n${errorMsg}`;
      
      // Agregar sugerencias basadas en el tipo de error
      if (errorMsg.includes('permisos') || errorMsg.includes('superadmin')) {
        mensajeMostrar += '\n\n💡 Sugerencia: No tienes permisos suficientes para eliminar este usuario';
      } else if (errorMsg.includes('mismo') || errorMsg.includes('eliminarte')) {
        mensajeMostrar += '\n\n💡 Sugerencia: No puedes eliminarte a ti mismo';
      } else if (errorMsg.includes('no encontrado')) {
        mensajeMostrar += '\n\n💡 Sugerencia: El usuario ya fue eliminado o no existe';
      }
      
      alert(mensajeMostrar);
    } else if (error.response && error.response.status === 403) {
      alert('❌ No tienes permisos para eliminar este usuario.\n\n💡 Solo los superadministradores pueden eliminar otros superadministradores.');
    } else if (error.response && error.response.status === 404) {
      alert('❌ Usuario no encontrado.\n\n💡 Es posible que el usuario ya haya sido eliminado.');
    } else {
      alert('❌ Error inesperado al eliminar usuario.\n\nPor favor, verifique su conexión e inténtelo nuevamente.');
    }
  }
};
const handleToggleActivo = async (id) => {
  // Buscar el usuario para verificar su rol
  const usuarioEncontrado = usuarios.find(u => u.id === id);
  
  // Verificar si el admin está intentando suspender/activar un usuario superadmin
  if (user?.rol === 'admin_rrhh' && usuarioEncontrado?.rol === 'superadmin') {
    alert('No tienes permisos para suspender/activar usuarios superadmin');
    return;
  }
  
  try {
    await apiRequest(`/api/usuarios/${id}/activo`, {
      method: 'PATCH'
    });
    fetchUsuarios();
  } catch (error) {
    if (error.response && error.response.status === 400) {
      alert(error.response.data.error || 'No se puede suspender este usuario.');
    } else {
      console.error('Error al suspender/activar usuario', error);
    }
  }
};

const user = (() => {
  try {
    const rol = secureStorage.getItem('userRol');
    const nombre = secureStorage.getItem('userNombre');
    return rol && nombre ? { rol, nombre } : null;
  } catch {
    return null;
  }
})();

// Función para convertir fecha de Excel a formato YYYY-MM-DD
const convertirFechaExcel = (fechaExcel) => {
  if (!fechaExcel || fechaExcel === '') return '';
  
  // Si ya es una fecha en formato string, devolverla
  if (typeof fechaExcel === 'string' && fechaExcel.includes('-')) {
    return fechaExcel;
  }
  
  // Si es un número (formato Excel), convertirlo
  if (typeof fechaExcel === 'number') {
    // Excel cuenta los días desde 1900-01-01, pero hay un bug histórico
    // donde considera 1900 como año bisiesto, así que restamos 1
    const diasDesde1900 = fechaExcel - 1;
    const fechaBase = new Date('1900-01-01');
    const fechaResultado = new Date(fechaBase.getTime() + (diasDesde1900 * 24 * 60 * 60 * 1000));
    
    // Formatear como YYYY-MM-DD
    const año = fechaResultado.getFullYear();
    const mes = String(fechaResultado.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaResultado.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
  }
  
  return '';
};

// Funciones para importación masiva
const handleArchivoExcel = (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  setArchivoExcel(archivo);
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Tomar la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        alert('El archivo Excel está vacío o no tiene datos válidos');
        return;
      }

      // Mostrar las columnas disponibles para debug
      const columnasDisponibles = Object.keys(jsonData[0]);
      setColumnasDetectadas(columnasDisponibles);
      
      // Mostrar alerta con las columnas encontradas
      alert(`Columnas encontradas en el Excel: ${columnasDisponibles.join(', ')}`);

      // Mapear las columnas del Excel a nuestro formato esperado
      const datosFormateados = jsonData.map(fila => {
        // Obtener nombre y apellido tal como están en el Excel
        let nombre = '';
        let apellido = '';
        
        // Prioridad 1: Buscar columnas separadas de nombre y apellido
        if (fila.nombre || fila.Nombre || fila.NOMBRE) {
          nombre = String(fila.nombre || fila.Nombre || fila.NOMBRE || '').trim();
        }
        
        if (fila.apellido || fila.Apellido || fila.APELLIDO) {
          apellido = String(fila.apellido || fila.Apellido || fila.APELLIDO || '').trim();
        }
        
        // Si no hay columnas separadas, buscar nombre completo y separarlo
        if (!nombre && !apellido) {
          const nombreCompleto = fila.nombreCompleto || fila.NombreCompleto || fila.NOMBRE_COMPLETO || fila.nombre_completo || '';
          
          if (nombreCompleto && typeof nombreCompleto === 'string') {
            const partesNombre = nombreCompleto.trim().split(' ');
            if (partesNombre.length >= 2) {
              // Tomar la primera palabra como nombre y el resto como apellido
              nombre = partesNombre[0];
              apellido = partesNombre.slice(1).join(' ');
            } else if (partesNombre.length === 1) {
              // Si solo hay una palabra, usarla como nombre
              nombre = partesNombre[0];
              apellido = 'Sin Apellido'; // Valor por defecto
            }
          }
        }
        
        // Si aún no tenemos datos, intentar con otras variaciones
        if (!nombre) {
          nombre = String(fila.firstName || fila.first_name || fila.primer_nombre || fila.name || '').trim();
        }
        
        if (!apellido) {
          apellido = String(fila.lastName || fila.last_name || fila.apellidos || fila.surname || '').trim();
        }
        
        // Intentar diferentes variaciones para el DNI
        const dni = fila.DocNro || fila.Docnro || fila.docnro || fila.DOCNRO || 
                   fila.doc_nro || fila.DOC_NRO ||
                   fila.documento || fila.Documento || fila.DOCUMENTO ||
                   fila.dni || fila.DNI || fila.Dni ||
                   fila.nro_documento || fila.nroDocumento || '';
        
        
        // Convertir DNI a string y limpiar
        const dniLimpio = String(dni || '').trim();
        
        // Validar que el DNI no esté vacío
        if (!dniLimpio || dniLimpio === '' || dniLimpio === 'null' || dniLimpio === 'undefined') {
          console.error('DNI vacío o inválido para:', nombre, apellido);
          return null; // Esto causará que se filtre más abajo
        }
        
        // Limpiar nombre y apellido para el email (remover acentos y espacios)
        const nombreLimpio = nombre.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // remover acentos
          .replace(/[^a-z0-9]/g, ""); // solo letras y números
        
        const apellidoLimpio = apellido.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // remover acentos
          .replace(/[^a-z0-9]/g, ""); // solo letras y números
        
        const fechaConvertida = convertirFechaExcel(fila.FecNacimiento || fila.fecha_nacimiento || fila.fechaNacimiento || fila.FechaNacimiento || '');

        // Función para limpiar y validar campos
        const limpiarCampo = (valor, maxLength = 255) => {
          if (!valor) return '';
          const valorLimpio = String(valor).trim();
          if (valorLimpio === 'null' || valorLimpio === 'undefined') return '';
          return valorLimpio.length > maxLength ? valorLimpio.substring(0, maxLength) : valorLimpio;
        };

        // Función especial para teléfonos
        const limpiarTelefono = (valor) => {
          if (!valor) return '';
          const valorLimpio = String(valor).replace(/[^\d\-+() ]/g, '').trim();
          if (valorLimpio === 'null') return '';
          return valorLimpio.length > 20 ? valorLimpio.substring(0, 20) : valorLimpio;
        };

        // Función para construir domicilio completo concatenado
        const construirDomicilioCompleto = (fila) => {
          const calle = limpiarCampo(fila.Calle || fila.calle || fila.CALLE || fila.DomicilioCalle || fila.CalleDomicilio || fila.calle_domicilio || '', 200);
          const numero = limpiarCampo(fila.DomicilioNro || fila.Numero || fila.numero || fila.NUMERO || fila.Nro || fila.nro || fila.NumCalle || fila.num_calle || '', 10);
          const piso = limpiarCampo(fila.DomicilioPiso || fila.Piso || fila.piso || fila.PISO || fila.NroPiso || fila.nro_piso || '', 10);
          const dpto = limpiarCampo(fila.DomicilioDpto || fila.Dpto || fila.dpto || fila.DPTO || fila.Departamento || fila.departamento || fila.Unidad || fila.unidad || '', 10);
          
          let domicilioCompleto = '';
          
          // Construir: Calle Número - Piso Dpto
          if (calle) {
            domicilioCompleto = calle;
            if (numero) {
              domicilioCompleto += ` ${numero}`;
            }
            if (piso || dpto) {
              domicilioCompleto += ' -';
              if (piso) {
                domicilioCompleto += ` Piso ${piso}`;
              }
              if (dpto) {
                domicilioCompleto += ` Dpto ${dpto}`;
              }
            }
          } else {
            // Si no hay calle, usar el domicilio tal como viene del Excel
            domicilioCompleto = limpiarCampo(fila.Domicilio || fila.domicilio || fila.DOMICILIO || fila.Direccion || fila.direccion || '', 200);
          }
          
          return domicilioCompleto;
        };
        
        return {
          legajo: limpiarCampo(fila.Codigo || fila.codigo || fila.CODIGO || '', 50),
          dni: dniLimpio,
          nombre: limpiarCampo(nombre, 100),
          apellido: limpiarCampo(apellido, 100),
          correo: `${nombreLimpio}.${apellidoLimpio}@temp.com`,
          password: dniLimpio, // Password automático usando el DNI
          rol: fila.rol || fila.Rol || fila.ROL || 'empleado',
          cuil: limpiarCampo(fila.CUIL || fila.cuil || fila.Cuil || '', 20),
          fecha_nacimiento: fechaConvertida,
          fecha_ingreso: convertirFechaExcel(fila.FecIngreso || fila.fecha_ingreso || fila.fechaIngreso || fila.FechaIngreso || fila.FechaAlta || fila.fecha_alta || '') || new Date().toISOString().split('T')[0],
          // Campos adicionales para el legajo con validación y mapeo correcto
          domicilio: construirDomicilioCompleto(fila),
          localidad: limpiarCampo(fila.DomicilioLoc || fila.Localidad || fila.localidad || fila.LOCALIDAD || fila.domicilio_localidad || fila.Ciudad || fila.ciudad || '', 100),
          codigo_postal: limpiarCampo(fila.DomicilioCP || fila.CP || fila.cp || fila.CodigoPostal || fila.codigo_postal || fila.CodPostal || fila.cod_postal || '', 10),
          domicilio_nro: limpiarCampo(fila.DomicilioNro || fila.Numero || fila.numero || fila.NUMERO || fila.Nro || fila.nro || fila.NumCalle || fila.num_calle || '', 10),
          domicilio_piso: limpiarCampo(fila.DomicilioPiso || fila.Piso || fila.piso || fila.PISO || fila.NroPiso || fila.nro_piso || '', 10),
          domicilio_dpto: limpiarCampo(fila.DomicilioDpto || fila.Dpto || fila.dpto || fila.DPTO || fila.Departamento || fila.departamento || fila.Unidad || fila.unidad || '', 10),
          telefono_contacto: limpiarTelefono(fila.TelContacto || fila.Telefono || fila.telefono || fila.TELEFONO || fila.Tel || fila.Celular || fila.celular || ''),
          contacto_emergencia: limpiarTelefono(fila.TelEmergencia || fila.ContactoEmergencia || fila.contacto_emergencia || fila.Emergencia || fila.TelFamiliar || fila.tel_familiar || ''),
          estado_civil: limpiarCampo(fila.EstCivil || fila.EstadoCivil || fila.estado_civil || fila.ESTADO_CIVIL || fila.EstadoCiv || fila.estado_civ || '', 50),
          cuenta_bancaria: limpiarCampo(fila.CuentaBco || fila.CBU || fila.cbu || fila.CuentaBancaria || fila.cuenta_bancaria || fila.NroCuenta || fila.nro_cuenta || '', 30),
          banco_destino: limpiarCampo(fila.DescBco || fila.descbco || fila.DESCBCO || fila.DesBanco || fila.desbanco || fila.DESBANCO || fila.BancoNombre || fila.Banco || fila.banco || fila.BANCO || fila.EntidadBancaria || fila.entidad_bancaria || '', 100),
          centro_costos: limpiarCampo(fila.CentroA || fila.centroa || fila.CENTROA || fila.CentroCosto || fila.CentroCostos || fila.centro_costos || fila.CENTRO_COSTOS || fila.CC || fila.cc || '', 100),
          tarea_desempenada: limpiarCampo(fila.CargoDesc || fila.Cargo || fila.cargo || fila.CARGO || fila.Puesto || fila.puesto || fila.Tarea || fila.tarea || fila.Funcion || fila.funcion || '', 100),
          sexo: limpiarCampo(fila.GeneroDesc || fila.Sexo || fila.sexo || fila.SEXO || fila.Genero || fila.genero || fila.Tipo || fila.tipo || '', 10),
          nacionalidad: limpiarCampo(fila.NacionalidadDesc || fila.Nacionalidad || fila.nacionalidad || fila.NACIONALIDAD || fila.Pais || fila.pais || 'Argentina', 50),
          provincia: limpiarCampo(fila.ProvinciaDesc || fila.Provincia || fila.provincia || fila.PROVINCIA || fila.Prov || fila.prov || '', 50),
          // Campos adicionales que faltan
          apellido_casada: limpiarCampo(fila.ApellidoCasada || fila.apellido_casada || fila.APELLIDO_CASADA || fila.ApellidoMatrimonio || fila.apellido_matrimonio || '', 100),
          domicilio_calle: limpiarCampo(fila.Calle || fila.calle || fila.CALLE || fila.DomicilioCalle || fila.CalleDomicilio || fila.calle_domicilio || '', 200),
          tipo_documento: limpiarCampo(fila.TipoDocumento || fila.tipo_documento || fila.TIPO_DOCUMENTO || fila.TipoDoc || fila.tipo_doc || 'DNI', 10),
          nro_documento: dniLimpio,
          email_personal: limpiarCampo(fila.Email || fila.email || fila.EMAIL || fila.Correo || fila.correo || fila.CORREO || `${nombreLimpio}.${apellidoLimpio}@temp.com`, 100)
        };
      }).filter(usuario => usuario !== null); // Filtrar usuarios con datos inválidos
      
      setDatosImportar(datosFormateados);
    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error);
      alert('Error al procesar el archivo Excel. Asegúrate de que sea un archivo válido.');
    }
  };
  
  reader.readAsArrayBuffer(archivo);
};

const handleImportarMasivo = async () => {
  if (datosImportar.length === 0) {
    alert('No hay datos para importar');
    return;
  }


  setImportandoEnProgreso(true);
  setTotalImportacion(datosImportar.length);
  setProgresoImportacion(0);
  setResultadoImportacion(null);

  try {
    const resultados = {
      exitosos: 0,
      errores: [],
      advertencias: []
    };

    // Procesar usuarios en lotes de 10 para no sobrecargar el servidor
    const tamanoLote = 10;
    for (let i = 0; i < datosImportar.length; i += tamanoLote) {
      const lote = datosImportar.slice(i, i + tamanoLote);
      
      try {
        const payload = { usuarios: lote };
        
        const response = await apiRequest('/api/usuarios/importar-masivo', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        
        // Acumular resultados
        if (response.data.exitosos) resultados.exitosos += response.data.exitosos;
        if (response.data.errores) resultados.errores.push(...response.data.errores);
        if (response.data.advertencias) resultados.advertencias.push(...response.data.advertencias);
        
      } catch (error) {
        console.error('Error en lote:', error);
        // Agregar errores del lote fallido
        for (let j = 0; j < lote.length; j++) {
          resultados.errores.push({
            fila: i + j + 1,
            error: error.response?.data?.error || 'Error de conexión',
            usuario: `${lote[j].nombre || 'N/A'} ${lote[j].apellido || 'N/A'}`
          });
        }
      }
      
      // Actualizar progreso
      setProgresoImportacion(Math.min(i + tamanoLote, datosImportar.length));
      
      // Pequeña pausa para permitir que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setResultadoImportacion(resultados);
    fetchUsuarios(); // Recargar la lista de usuarios
    
  } catch (error) {
    console.error('Error completo:', error);
    alert(error.response?.data?.error || 'Error al importar usuarios');
  } finally {
    setImportandoEnProgreso(false);
  }
};

const handleActualizarLegajos = async () => {
  if (datosImportar.length === 0) {
    alert('No hay datos para actualizar');
    return;
  }


  setImportandoEnProgreso(true);
  setTotalImportacion(datosImportar.length);
  setProgresoImportacion(0);
  setResultadoImportacion(null);

  try {
    const resultados = {
      exitosos: 0,
      errores: [],
      advertencias: []
    };

    // Procesar legajos en lotes de 10
    const tamanoLote = 10;
    for (let i = 0; i < datosImportar.length; i += tamanoLote) {
      const lote = datosImportar.slice(i, i + tamanoLote);
      
      try {
        const payload = { usuarios: lote };
        
        const response = await apiRequest('/api/usuarios/actualizar-legajos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        
        // Acumular resultados
        if (response.data.exitosos) resultados.exitosos += response.data.exitosos;
        if (response.data.errores) resultados.errores.push(...response.data.errores);
        if (response.data.advertencias) resultados.advertencias.push(...response.data.advertencias);
        
      } catch (error) {
        console.error('Error en lote de legajos:', error);
        // Agregar errores del lote fallido
        for (let j = 0; j < lote.length; j++) {
          resultados.errores.push({
            fila: i + j + 1,
            error: error.response?.data?.error || 'Error de conexión',
            usuario: `${lote[j].nombre || 'N/A'} ${lote[j].apellido || 'N/A'}`
          });
        }
      }
      
      // Actualizar progreso
      setProgresoImportacion(Math.min(i + tamanoLote, datosImportar.length));
      
      // Pequeña pausa para permitir que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setResultadoImportacion(resultados);
    fetchUsuarios(); // Recargar la lista de usuarios
    
  } catch (error) {
    console.error('Error completo:', error);
    alert(error.response?.data?.error || 'Error al actualizar legajos');
  } finally {
    setImportandoEnProgreso(false);
  }
};

// Función para procesar archivo de datos adicionales
const procesarArchivoDatos = (archivo) => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      
      // Función para limpiar y validar campos
      const limpiarCampo = (valor, maxLength = 255) => {
        if (!valor) return '';
        const valorLimpio = valor.toString().trim();
        if (valorLimpio === 'null' || valorLimpio === 'NULL') return '';
        return valorLimpio.length > maxLength ? valorLimpio.substring(0, maxLength) : valorLimpio;
      };
      
      // Función para limpiar teléfonos
      const limpiarTelefono = (valor) => {
        if (!valor) return '';
        const valorLimpio = valor.toString().trim().replace(/[^0-9-]/g, '');
        if (valorLimpio === 'null') return '';
        return valorLimpio.length > 20 ? valorLimpio.substring(0, 20) : valorLimpio;
      };
      
      // Función para convertir fechas de Excel
      const convertirFechaExcel = (valor) => {
        if (!valor) return '';
        if (typeof valor === 'number') {
          const fecha = new Date((valor - 25569) * 86400 * 1000);
          return fecha.toISOString().split('T')[0];
        }
        if (typeof valor === 'string') {
          const fecha = new Date(valor);
          if (!isNaN(fecha.getTime())) {
            return fecha.toISOString().split('T')[0];
          }
        }
        return '';
      };
      
      const datosFormateados = jsonData.map((fila, index) => {
        // Buscar identificadores - CUIL es prioritario para este archivo
        const cuil = fila.CUIL || fila.cuil || fila.Cuil || '';
        const dni = fila.DNI || fila.dni || fila.Dni || fila.NroDocumento || fila.nro_documento || fila.Documento || '';
        const legajo = fila.Legajo || fila.legajo || fila.LEGAJO || fila.Codigo || fila.codigo || '';
        
        if (!cuil && !dni && !legajo) {
          console.warn(`Fila ${index + 1}: Sin CUIL, DNI ni legajo, se omite`);
          return null;
        }
        
        return {
          // Identificadores para buscar el usuario/legajo (CUIL es prioritario)
          cuil_busqueda: cuil,
          dni_busqueda: dni,
          legajo_busqueda: legajo,
          
          // Datos adicionales específicos del archivo que se pueden actualizar
          fecha_ingreso: convertirFechaExcel(fila.FecIngreso || fila.fecha_ingreso || fila.fechaIngreso || fila.FechaIngreso || fila.FechaAlta || fila.fecha_alta || ''),
          cuenta_bancaria: limpiarCampo(fila.nroctabancaria || fila.NroCtaBancaria || fila.nro_cta_bancaria || fila.CuentaBco || fila.CBU || fila.cbu || fila.CuentaBancaria || fila.cuenta_bancaria || '', 30),
          banco_destino: limpiarCampo(fila.DescBco || fila.descbco || fila.DESCBCO || fila.DesBanco || fila.desbanco || fila.DESBANCO || fila.descbanco || fila.DescBanco || fila.desc_banco || fila.BancoNombre || fila.Banco || fila.banco || fila.BANCO || '', 100),
          centro_costos: limpiarCampo(fila.CentroA || fila.centroa || fila.CENTROA || fila.cenrtoA || fila.CenrtoA || fila.centro_a || fila.CentroCosto || fila.CentroCostos || fila.centro_costos || fila.CENTRO_COSTOS || '', 100),
          tarea_desempenada: limpiarCampo(fila.atributoEsp1 || fila.AtributoEsp1 || fila.atributo_esp1 || fila.CargoDesc || fila.Cargo || fila.cargo || fila.CARGO || fila.Tarea || fila.tarea || '', 100),
          
          // Otros datos adicionales que se pueden actualizar
          email_personal: limpiarCampo(fila.Email || fila.email || fila.EMAIL || fila.Correo || fila.correo || fila.CORREO || '', 100),
          telefono_contacto: limpiarTelefono(fila.TelContacto || fila.Telefono || fila.telefono || fila.TELEFONO || fila.Tel || fila.Celular || fila.celular || ''),
          contacto_emergencia: limpiarTelefono(fila.TelEmergencia || fila.ContactoEmergencia || fila.contacto_emergencia || fila.Emergencia || fila.TelFamiliar || fila.tel_familiar || ''),
          domicilio: limpiarCampo(fila.Domicilio || fila.domicilio || fila.DOMICILIO || fila.DomicilioCalle || fila.domicilio_calle || fila.Direccion || fila.direccion || '', 200),
          localidad: limpiarCampo(fila.DomicilioLoc || fila.Localidad || fila.localidad || fila.LOCALIDAD || fila.domicilio_localidad || fila.Ciudad || fila.ciudad || '', 100),
          codigo_postal: limpiarCampo(fila.DomicilioCP || fila.CP || fila.cp || fila.CodigoPostal || fila.codigo_postal || fila.CodPostal || fila.cod_postal || '', 10),
          domicilio_calle: limpiarCampo(fila.Calle || fila.calle || fila.CALLE || fila.DomicilioCalle || fila.CalleDomicilio || fila.calle_domicilio || '', 200),
          domicilio_nro: limpiarCampo(fila.DomicilioNro || fila.Numero || fila.numero || fila.NUMERO || fila.Nro || fila.nro || fila.NumCalle || fila.num_calle || '', 10),
          domicilio_piso: limpiarCampo(fila.DomicilioPiso || fila.Piso || fila.piso || fila.PISO || fila.NroPiso || fila.nro_piso || '', 10),
          domicilio_dpto: limpiarCampo(fila.DomicilioDpto || fila.Dpto || fila.dpto || fila.DPTO || fila.Departamento || fila.departamento || fila.Unidad || fila.unidad || '', 10),
          estado_civil: limpiarCampo(fila.DescEstado || fila.EstCivil || fila.EstadoCivil || fila.estado_civil || fila.ESTADO_CIVIL || fila.EstadoCiv || fila.estado_civ || '', 100),
          provincia: limpiarCampo(fila.ProvinciaDesc || fila.Provincia || fila.provincia || fila.PROVINCIA || fila.Prov || fila.prov || '', 50),
          apellido_casada: limpiarCampo(fila.ApellidoCasada || fila.apellido_casada || fila.APELLIDO_CASADA || fila.ApellidoMatrimonio || fila.apellido_matrimonio || '', 100)
        };
      }).filter(dato => dato !== null);
      
      setDatosAdicionales(datosFormateados);
    } catch (error) {
      console.error('Error al procesar el archivo de datos adicionales:', error);
      alert('Error al procesar el archivo Excel. Asegúrate de que sea un archivo válido.');
    }
  };
  
  reader.readAsArrayBuffer(archivo);
};

// Función para importar datos adicionales
const handleImportarDatosAdicionales = async () => {
  if (datosAdicionales.length === 0) {
    alert('No hay datos para importar');
    return;
  }
  

  setImportandoDatos(true);
  setTotalDatos(datosAdicionales.length);
  setProgresoDatos(0);
  setResultadoDatos(null);
  
  try {
    const resultados = {
      exitosos: 0,
      errores: [],
      advertencias: []
    };

    // Procesar datos en lotes de 10 para no sobrecargar el servidor
    const tamanoLote = 10;
    for (let i = 0; i < datosAdicionales.length; i += tamanoLote) {
      const lote = datosAdicionales.slice(i, i + tamanoLote);
      
      try {
        const payload = { datos: lote };
        
        const response = await apiRequest('/api/legajos/actualizar-datos-adicionales', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        
        // Acumular resultados
        if (response.data.exitosos) resultados.exitosos += response.data.exitosos;
        if (response.data.errores) resultados.errores.push(...response.data.errores);
        if (response.data.advertencias) resultados.advertencias.push(...response.data.advertencias);
        
      } catch (error) {
        console.error('Error en lote de datos adicionales:', error);
        // Agregar errores del lote fallido
        for (let j = 0; j < lote.length; j++) {
          resultados.errores.push({
            fila: i + j + 1,
            error: error.response?.data?.error || 'Error de conexión',
            cuil: lote[j].cuil_busqueda || 'N/A'
          });
        }
      }
      
      // Actualizar progreso
      setProgresoDatos(Math.min(i + tamanoLote, datosAdicionales.length));
      
      // Pequeña pausa para permitir que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setResultadoDatos(resultados);
    alert(`Datos adicionales importados: ${resultados.exitosos} exitosos, ${resultados.errores?.length || 0} errores`);
    
  } catch (error) {
    console.error('Error al importar datos adicionales:', error);
    alert(error.response?.data?.error || 'Error al importar datos adicionales');
  } finally {
    setImportandoDatos(false);
  }
};

const descargarPlantilla = async () => {
  try {
    
    // Llamar al endpoint del backend para descargar la plantilla - necesita la respuesta raw
    const response = await apiRequest('/api/usuarios/plantilla-excel', {
      method: 'GET',
      returnRaw: true
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error en respuesta del servidor:', response.status, errorData);
      alert(`Error al descargar plantilla: ${response.status} - ${errorData}`);
      return;
    }

    // Obtener el blob del archivo
    const blob = await response.blob();
    
    // Crear URL temporal para descarga
    const url = window.URL.createObjectURL(blob);
    
    // Crear elemento de descarga temporal
    const link = document.createElement('a');
    link.href = url;
    
    // Obtener fecha actual para el nombre del archivo
    const fechaActual = new Date().toISOString().split('T')[0];
    link.download = `plantilla_carga_usuarios_${fechaActual}.xlsx`;
    
    // Agregar al DOM temporalmente y hacer clic
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('Plantilla Excel descargada exitosamente. El archivo contiene todas las columnas necesarias para la carga masiva.');
    
  } catch (error) {
    console.error('❌ Error al descargar plantilla:', error);
    alert('Error al descargar la plantilla Excel. Por favor, intente nuevamente.');
  }
};


const columns = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'legajo', headerName: 'Legajo', width: 100 },
  { field: 'dni', headerName: 'DNI', width: 100 },
  { field: 'nombre', headerName: 'Nombre', width: 300 },
  { field: 'apellido', headerName: 'Apellido', width: 300 },
  { field: 'correo', headerName: 'Correo', width: 300 },
  { field: 'rol', headerName: 'Rol', width: 150 },
  {
    field: 'convenio',
    headerName: 'Convenio',
    width: 150,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {params.row.convenio === 'dentro' ? (
          <>
            <Box sx={{ width: 8, height: 8, bgcolor: '#4caf50', borderRadius: '50%' }} />
            <span>Dentro</span>
          </>
        ) : (
          <>
            <Box sx={{ width: 8, height: 8, bgcolor: '#f44336', borderRadius: '50%' }} />
            <span>Fuera</span>
          </>
        )}
      </Box>
    )
  },
  {
    field: 'acciones',
    headerName: 'Acciones',
    width: 180,
    renderCell: (params) => {
      // Verificar si el usuario es superadmin
      const esSuperAdmin = params.row.rol === 'superadmin';
      const puedeEditar = user?.rol === 'superadmin' || !esSuperAdmin;
      
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            color="primary"
            size="small" 
            onClick={() => handleEditar(params.row)}
            disabled={!puedeEditar}
            title={!puedeEditar ? 'No puedes editar usuarios superadmin' : 'Editar usuario'}
            sx={{ 
              bgcolor: puedeEditar ? 'primary.50' : 'grey.200',
              '&:hover': { bgcolor: puedeEditar ? 'primary.100' : 'grey.200' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          
          <IconButton
            color={params.row.activo ? 'warning' : 'success'}
            size="small"
            onClick={() => handleToggleActivo(params.row.id)}
            disabled={!puedeEditar}
            title={!puedeEditar ? 'No puedes suspender/activar usuarios superadmin' : (params.row.activo ? 'Suspender usuario' : 'Activar usuario')}
            sx={{ 
              bgcolor: puedeEditar ? (params.row.activo ? 'warning.50' : 'success.50') : 'grey.200',
              '&:hover': { bgcolor: puedeEditar ? (params.row.activo ? 'warning.100' : 'success.100') : 'grey.200' }
            }}
          >
            {params.row.activo ? <SuspendIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}
          </IconButton>
          
          {user?.rol === 'superadmin' && (
            <IconButton 
              color="error" 
              size="small" 
              onClick={() => handleEliminarUsuario(params.row)}
              title="Eliminar usuario"
              sx={{ 
                bgcolor: 'error.50',
                '&:hover': { bgcolor: 'error.100' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
  }
];
  const [editando, setEditando] = useState(null);
const [usuarioEditado, setUsuarioEditado] = useState({
  legajo: '', dni: '', nombre: '', apellido: '', correo: '', rol: 'empleado', activo: 1, password: '', referente_id: '', convenio: 'dentro'
});

const handleEditar = (usuario) => {
  // Verificar si el admin está intentando editar un usuario superadmin
  if (user?.rol === 'admin_rrhh' && usuario.rol === 'superadmin') {
    alert('No tienes permisos para editar usuarios superadmin');
    return;
  }
  
  setUsuarioEditado(usuario);
  setEditando(true);
};

const handleGuardarCambios = async () => {
  try {
    await apiRequest(`/api/usuarios/${usuarioEditado.id}`, {
      method: 'PUT',
      body: JSON.stringify(usuarioEditado)
    });
    setEditando(false);
    fetchUsuarios(); // recargar la lista
  } catch (err) {
    console.error('Error al guardar cambios:', err);
  }
};

const [filtro, setFiltro] = useState('');

const usuariosFiltrados = usuarios.filter((u) =>
  u.apellido?.toLowerCase().includes(filtro.toLowerCase()) ||
  u.dni?.toString().includes(filtro)
);

  return (
    <Box sx={{ height: 600, width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 'bold', 
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 3
      }}>
        👥 Gestión de Usuarios
      </Typography>
      
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        gap: 2, 
        flexWrap: 'wrap',
        p: 2,
        bgcolor: '#f8fafc',
        borderRadius: 3,
        border: '1px solid #e2e8f0'
      }}>
        <Button 
          variant="contained" 
          onClick={() => setOpenCrear(true)}
          sx={{ 
            borderRadius: 2,
            fontWeight: 'bold',
            textTransform: 'none',
            px: 3
          }}
        >
          ➕ Crear Usuario
        </Button>
        
        {user?.rol === 'superadmin' && (
          <>
            <Button 
              variant="outlined" 
              startIcon={<Upload />}
              onClick={() => setOpenImportar(true)}
              sx={{ 
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              📥 Importar Masivo
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<Upload />}
              onClick={() => setOpenImportarDatos(true)}
              color="secondary"
              sx={{ 
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              📊 Importar Datos Adicionales
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<Download />}
              onClick={descargarPlantilla}
              sx={{ 
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              📋 Descargar Plantilla
            </Button>
          </>
        )}
      </Box>
      
      <TextField
        label="🔍 Buscar por apellido o DNI"
        variant="outlined"
        fullWidth
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'white',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          }
        }}
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Ingresa apellido o DNI para filtrar usuarios..."
      />
      
      <Box sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: '100%',
        margin: '0 auto'
      }}>
        <DataGrid
          rows={usuariosFiltrados}
          columns={columns}
          pageSize={10}
          getRowId={(row) => row.id}
          autoHeight
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#1976d2 !important',
              color: 'white !important',
              fontWeight: 'bold',
              fontSize: '1rem',
              borderBottom: 'none',
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: '#1976d2 !important',
                color: 'white !important',
                '&:focus': {
                  outline: 'none',
                },
                '&:focus-within': {
                  outline: 'none',
                },
                '& *': {
                  color: 'white !important'
                }
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: 'white !important',
                fontWeight: 'bold !important'
              },
              '& .MuiDataGrid-iconSeparator': {
                color: 'white !important'
              },
              '& .MuiDataGrid-sortIcon': {
                color: 'white !important'
              },
              '& .MuiDataGrid-menuIcon': {
                color: 'white !important'
              },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                color: 'white !important'
              }
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: '#f0f7ff',
                cursor: 'pointer'
              },
              '&:nth-of-type(odd)': {
                backgroundColor: '#fafafa',
              },
              '&:nth-of-type(even)': {
                backgroundColor: 'white',
              }
            },
            '& .MuiDataGrid-cell': {
              fontSize: '0.9rem',
              '&:focus': {
                outline: 'none',
              }
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0'
            }
          }}
        />
      </Box>


      <Dialog 
        open={openCrear} 
        onClose={() => setOpenCrear(false)} 
        fullWidth 
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 'bold'
        }}>
          👤 Crear Nuevo Usuario
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
            <TextField 
              label="📋 Legajo" 
              fullWidth 
              margin="normal" 
              value={nuevoUsuario.legajo}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, legajo: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField 
              label="🆔 DNI" 
              fullWidth 
              margin="normal" 
              value={nuevoUsuario.dni}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, dni: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField 
              label="👤 Nombre" 
              fullWidth 
              margin="normal" 
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField 
              label="👤 Apellido" 
              fullWidth 
              margin="normal" 
              value={nuevoUsuario.apellido}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellido: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField 
              label="📧 Correo" 
              fullWidth 
              margin="normal" 
              value={nuevoUsuario.correo}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField 
              label="🔢 CUIL" 
              fullWidth 
              margin="normal" 
              value={nuevoUsuario.cuil}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, cuil: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField 
              label="🎂 Fecha de nacimiento" 
              type="date" 
              fullWidth 
              margin="normal"
              InputLabelProps={{ shrink: true }} 
              value={nuevoUsuario.fecha_nacimiento}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, fecha_nacimiento: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField 
              select
              label="📋 Convenio"
              fullWidth
              margin="normal"
              value={nuevoUsuario.convenio}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, convenio: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="dentro">✅ Dentro de Convenio</MenuItem>
              <MenuItem value="fuera">❌ Fuera de Convenio</MenuItem>
            </TextField>
            <TextField 
              label="🔐 Contraseña" 
              type="password" 
              fullWidth 
              margin="normal" 
              value={nuevoUsuario.password}
              inputRef={passwordAnchorRef}
              onFocus={() => setShowPasswordChecklist(true)}
              onChange={(e) => {
                const value = e.target.value || '';
                setNuevoUsuario({ ...nuevoUsuario, password: value });
                setPasswordChecks(evaluatePassword(value));
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Floating checklist shown while password field is focused */}
            <ClickAwayListener onClickAway={() => setShowPasswordChecklist(false)}>
              <Popper open={showPasswordChecklist} anchorEl={passwordAnchorRef.current} placement="right-start" style={{ zIndex: 1300 }}>
                <Paper elevation={3} sx={{ p: 2, width: 300 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Requisitos de contraseña</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {passwordChecks.length ? (
                          <CheckCircleOutline sx={{ color: 'success.main' }} />
                        ) : (
                          <CancelIcon sx={{ color: 'text.disabled' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Mínimo 6 caracteres" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {passwordChecks.upper ? (
                          <CheckCircleOutline sx={{ color: 'success.main' }} />
                        ) : (
                          <CancelIcon sx={{ color: 'text.disabled' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos una letra mayúscula" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {passwordChecks.lower ? (
                          <CheckCircleOutline sx={{ color: 'success.main' }} />
                        ) : (
                          <CancelIcon sx={{ color: 'text.disabled' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos una letra minúscula" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {passwordChecks.number ? (
                          <CheckCircleOutline sx={{ color: 'success.main' }} />
                        ) : (
                          <CancelIcon sx={{ color: 'text.disabled' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos un número" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {passwordChecks.special ? (
                          <CheckCircleOutline sx={{ color: 'success.main' }} />
                        ) : (
                          <CancelIcon sx={{ color: 'text.disabled' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos un carácter especial (!@#$...)" />
                    </ListItem>
                  </List>
                </Paper>
              </Popper>
            </ClickAwayListener>
          </Box>
          
          <TextField 
            select 
            label="🎭 Rol" 
            fullWidth 
            margin="normal" 
            value={nuevoUsuario.rol}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            <MenuItem value="empleado">👨‍💼 Empleado</MenuItem>
            <MenuItem value="admin_rrhh">👨‍💻 Admin RRHH</MenuItem>
            <MenuItem value="referente">👨‍🏫 Referente</MenuItem>
            {user?.rol === 'superadmin' && (
              <MenuItem value="superadmin">👨‍💼 Super Admin</MenuItem>
            )}
          </TextField>
          
          {/* Mostrar selector de referente solo si el rol es empleado */}
          {nuevoUsuario.rol === 'empleado' && (
            <TextField 
              select 
              label="👨‍🏫 Referente (opcional)" 
              fullWidth 
              margin="normal" 
              value={nuevoUsuario.referente_id}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, referente_id: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="">Sin referente</MenuItem>
              {referentes.map((referente) => (
                <MenuItem key={referente.id} value={referente.id}>
                  {referente.nombre} {referente.apellido}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          bgcolor: '#f8fafc', 
          borderTop: '1px solid #e2e8f0',
          gap: 2
        }}>
          <Button 
            onClick={() => setOpenCrear(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3
            }}
          >
            ❌ Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCrearUsuario}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3
            }}
          >
            ✅ Crear Usuario
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editando} onClose={() => setEditando(false)}>
  <DialogTitle>Editar Usuario</DialogTitle>
  <DialogContent>
    <TextField label="Legajo" value={usuarioEditado.legajo}
      onChange={(e) => setUsuarioEditado({ ...usuarioEditado, legajo: e.target.value })} fullWidth margin="normal" />
    <TextField label="DNI" value={usuarioEditado.dni}
      onChange={(e) => setUsuarioEditado({ ...usuarioEditado, dni: e.target.value })} fullWidth margin="normal" />
    <TextField label="Nombre" value={usuarioEditado.nombre}
      onChange={(e) => setUsuarioEditado({ ...usuarioEditado, nombre: e.target.value })} fullWidth margin="normal" />
    <TextField label="Apellido" value={usuarioEditado.apellido}
      onChange={(e) => setUsuarioEditado({ ...usuarioEditado, apellido: e.target.value })} fullWidth margin="normal" />
    <TextField label="Correo" value={usuarioEditado.correo}
      onChange={(e) => setUsuarioEditado({ ...usuarioEditado, correo: e.target.value })} fullWidth margin="normal" />
    <TextField label="Nueva contraseña (opcional)" type="password"
      value={usuarioEditado.password || ''}
      inputRef={editPasswordAnchorRef}
      onFocus={() => {
        // anchor the floating checklist to the edit password field
        passwordAnchorRef.current = editPasswordAnchorRef.current;
        setShowPasswordChecklist(true);
      }}
      onChange={(e) => {
        const value = e.target.value || '';
        setUsuarioEditado({ ...usuarioEditado, password: value });
        setPasswordChecks(evaluatePassword(value));
      }}
      fullWidth margin="normal" />
    <TextField select label="Rol" fullWidth margin="normal" value={usuarioEditado.rol}
      onChange={(e) => setUsuarioEditado({ ...usuarioEditado, rol: e.target.value })}>
      <MenuItem value="empleado">Empleado</MenuItem>
      <MenuItem value="admin_rrhh">Admin RRHH</MenuItem>
      <MenuItem value="referente">Referente</MenuItem>
      {user?.rol === 'superadmin' && (
        <MenuItem value="superadmin">Super Admin</MenuItem>
      )}
    </TextField>
    
    <TextField 
      select
      label="Convenio"
      fullWidth
      margin="normal"
      value={usuarioEditado.convenio || 'dentro'}
      onChange={(e) => setUsuarioEditado({ ...usuarioEditado, convenio: e.target.value })}
    >
      <MenuItem value="dentro">✅ Dentro de Convenio</MenuItem>
      <MenuItem value="fuera">❌ Fuera de Convenio</MenuItem>
    </TextField>
    
    {/* Mostrar selector de referente solo si el rol es empleado */}
    {usuarioEditado.rol === 'empleado' && (
      <TextField select label="Referente (opcional)" fullWidth margin="normal" 
        value={usuarioEditado.referente_id || ''}
        onChange={(e) => setUsuarioEditado({ ...usuarioEditado, referente_id: e.target.value })}>
        <MenuItem value="">Sin referente</MenuItem>
        {referentes.map((referente) => (
          <MenuItem key={referente.id} value={referente.id}>
            {referente.nombre} {referente.apellido}
          </MenuItem>
        ))}
      </TextField>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditando(false)}>Cancelar</Button>
    <Button onClick={handleGuardarCambios} variant="contained">Guardar</Button>
  </DialogActions>
</Dialog>

{/* Diálogo de Importación Masiva */}
<Dialog open={openImportar} onClose={() => setOpenImportar(false)} maxWidth="lg" fullWidth>
  <DialogTitle>Importación Masiva de Usuarios</DialogTitle>
  <DialogContent>
    <Typography variant="body2" sx={{ mb: 2 }}>
      Selecciona un archivo Excel (.xlsx) con los datos de los usuarios. El archivo debe tener las siguientes columnas:
      <br />
      <strong>• codigo</strong> (para el legajo)
      <br />
      <strong>• Docnro</strong> (para el DNI)
      <br />
      <strong>• nombre</strong> (nombre del usuario)
      <br />
      <strong>• apellido</strong> (apellido del usuario)
      <br />
      <em>Nota: El email se generará automáticamente como nombre.apellido@temp.com y la contraseña será el DNI</em>
    </Typography>

    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="body2">
        <strong>Opciones disponibles:</strong>
        <br />
        • <strong>Importar Usuarios:</strong> Crea nuevos usuarios y sus legajos
        <br />
        • <strong>Actualizar Legajos:</strong> Actualiza la información de legajos de usuarios existentes (útil para completar datos faltantes)
      </Typography>
    </Alert>
    
    <Box sx={{ mb: 3 }}>
      <Input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleArchivoExcel}
        sx={{ mb: 2 }}
      />
      
      {archivoExcel && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Archivo seleccionado: {archivoExcel.name}
        </Typography>
      )}

      {columnasDetectadas.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Columnas detectadas:</strong> {columnasDetectadas.join(', ')}
          </Typography>
        </Alert>
      )}
      
      {datosImportar.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Se procesarán {datosImportar.length} usuarios
        </Alert>
      )}
    </Box>

    {/* Vista previa de datos */}
    {datosImportar.length > 0 && (
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Vista previa de datos ({datosImportar.length} usuarios)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {datosImportar.slice(0, 5).map((usuario, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Legajo:</strong> {usuario.legajo} | 
                  <strong> DNI:</strong> {usuario.dni} | 
                  <strong> Nombre:</strong> {usuario.nombre} {usuario.apellido}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Email generado:</strong> {usuario.correo} | 
                  <strong> Password:</strong> {usuario.password} | 
                  <strong> Rol:</strong> {usuario.rol}
                </Typography>
              </Box>
            ))}
            {datosImportar.length > 5 && (
              <Typography variant="body2" color="textSecondary">
                ... y {datosImportar.length - 5} usuarios más
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    )}

    {/* Resultado de la importación */}
    {resultadoImportacion && (
      <Box sx={{ mt: 2 }}>
        <Alert 
          severity={resultadoImportacion.errores.length === 0 ? "success" : "warning"} 
          sx={{ mb: 2 }}
        >
          {resultadoImportacion.mensaje}
        </Alert>
        
        {resultadoImportacion.errores.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography color="error">
                Errores ({resultadoImportacion.errores.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {resultadoImportacion.errores.map((error, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Fila ${error.fila}: ${error.usuario}`}
                      secondary={error.error}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    )}

    {/* Barra de progreso */}
    {importandoEnProgreso && (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Importando usuarios: {progresoImportacion} / {totalImportacion}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={totalImportacion > 0 ? (progresoImportacion / totalImportacion) * 100 : 0} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => {
      setOpenImportar(false);
      setArchivoExcel(null);
      setDatosImportar([]);
      setResultadoImportacion(null);
      setColumnasDetectadas([]);
      setProgresoImportacion(0);
      setTotalImportacion(0);
    }}
    disabled={importandoEnProgreso}
    >
      Cerrar
    </Button>
    <Button 
      variant="outlined" 
      onClick={handleActualizarLegajos}
      disabled={datosImportar.length === 0 || importandoEnProgreso}
      sx={{ mr: 1 }}
    >
      {importandoEnProgreso ? 'Actualizando...' : 'Actualizar Legajos'}
    </Button>
    <Button 
      variant="contained" 
      onClick={handleImportarMasivo}
      disabled={datosImportar.length === 0 || importandoEnProgreso}
    >
      {importandoEnProgreso ? 'Importando...' : 'Importar Usuarios'}
    </Button>
  </DialogActions>
</Dialog>

{/* Modal Importar Datos Adicionales */}
<Dialog open={openImportarDatos} onClose={() => setOpenImportarDatos(false)} maxWidth="lg" fullWidth>
  <DialogTitle>
    Importar Datos Adicionales
    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
      Importa datos adicionales (fecha ingreso, cuenta bancaria, banco, centro de costos, tarea desempeñada) desde un archivo Excel para completar información de legajos existentes. La búsqueda se realizará por CUIL (prioritario), DNI o número de legajo.
    </Typography>
  </DialogTitle>
  <DialogContent>
    <Box sx={{ mt: 2 }}>
      <input
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        id="archivo-datos-button"
        type="file"
        onChange={(e) => {
          const archivo = e.target.files[0];
          if (archivo) {
            setArchivoExcelDatos(archivo);
            procesarArchivoDatos(archivo);
          }
        }}
      />
      <label htmlFor="archivo-datos-button">
        <Button variant="outlined" component="span" startIcon={<Upload />}>
          Seleccionar Archivo Excel
        </Button>
      </label>
      
      {archivoExcelDatos && (
        <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
          ✓ Archivo seleccionado: {archivoExcelDatos.name}
        </Typography>
      )}
      
      {datosAdicionales.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">
            Datos a importar: {datosAdicionales.length} registros
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Los datos se actualizarán basándose en CUIL (prioritario), DNI o número de legajo
          </Typography>
          
          <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(datosAdicionales.slice(0, 3), null, 2)}
              {datosAdicionales.length > 3 && '\n... y más registros'}
            </pre>
          </Box>
        </Box>
      )}
      
      {/* Barra de progreso para datos adicionales */}
      {importandoDatos && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Importando datos adicionales: {progresoDatos} / {totalDatos}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={totalDatos > 0 ? (progresoDatos / totalDatos) * 100 : 0} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}
      
      {resultadoDatos && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" color="success.main">
            ✅ Resultados de la importación:
          </Typography>
          <Typography>• Registros exitosos: {resultadoDatos.exitosos}</Typography>
          <Typography>• Errores: {resultadoDatos.errores?.length || 0}</Typography>
          <Typography>• Advertencias: {resultadoDatos.advertencias?.length || 0}</Typography>
          
          {resultadoDatos.errores && resultadoDatos.errores.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="error">Errores:</Typography>
              {resultadoDatos.errores.slice(0, 5).map((error, index) => (
                <Typography key={index} variant="caption" color="error" display="block">
                  • Fila {error.fila}: {error.error}
                </Typography>
              ))}
              {resultadoDatos.errores.length > 5 && (
                <Typography variant="caption" color="textSecondary">
                  ... y {resultadoDatos.errores.length - 5} errores más
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={() => {
        setOpenImportarDatos(false);
        setDatosAdicionales([]);
        setArchivoExcelDatos(null);
        setResultadoDatos(null);
        setProgresoDatos(0);
        setTotalDatos(0);
      }}
      disabled={importandoDatos}
    >
      Cerrar
    </Button>
    <Button 
      variant="contained" 
      onClick={handleImportarDatosAdicionales}
      disabled={datosAdicionales.length === 0 || importandoDatos}
    >
      {importandoDatos ? 'Importando...' : 'Importar Datos Adicionales'}
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
};

export default Usuarios;
