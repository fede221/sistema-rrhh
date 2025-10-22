import { API_BASE_URL } from '../../../config';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, Accordion, AccordionSummary, 
  AccordionDetails, Input, LinearProgress, FormControl, InputLabel,
  Select, MenuItem, IconButton, Chip, Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getToken, getUser } from '../../auth';
import { Navigate } from 'react-router-dom';
import { 
  ExpandMore, 
  CloudUpload, 
  Edit as EditIcon, 
  ContentCopy as CopyIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import GestionLegajos from '../../../components/GestionLegajos';

const LegajoAdmin = () => {
  const user = getUser();
  const [legajos, setLegajos] = useState([]);
  const [open, setOpen] = useState(false);
  const [openImportar, setOpenImportar] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modoCopia, setModoCopia] = useState(false);
  const [formData, setFormData] = useState({});
  const [erroresValidacion, setErroresValidacion] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [datosImportar, setDatosImportar] = useState([]);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  // Estados para la barra de progreso
  const [progresoImportacion, setProgresoImportacion] = useState(0);
  const [totalImportacion, setTotalImportacion] = useState(0);
  const [importandoEnProgreso, setImportandoEnProgreso] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [columnasDetectadas, setColumnasDetectadas] = useState([]);
  const [showLegajos, setShowLegajos] = useState(false);

  useEffect(() => {
    if (user && (user.rol === 'admin_rrhh' || user.rol === 'superadmin')) {
      fetchLegajos();
      fetchEmpresas();
    }
  }, []);

  // Función para construir domicilio completo
  const construirDomicilioCompleto = (calle, nro, piso, dpto) => {
    if (!calle && !nro && !piso && !dpto) return '';
    
    let domicilio = '';
    
    if (calle) domicilio += calle;
    if (nro) domicilio += (domicilio ? ' ' : '') + nro;
    
    if (piso || dpto) {
      domicilio += ' - ';
      if (piso) domicilio += piso;
      if (dpto) domicilio += (piso ? ' ' : '') + dpto;
    }
    
    return domicilio.trim();
  };

  // Función para formatear fechas sin problemas de timezone
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    
    // Verificar que sea una cadena antes de usar split
    if (typeof fecha !== 'string') {
      console.warn('formatearFecha recibió un valor no string:', fecha);
      return '';
    }
    
    // Si la fecha viene en formato YYYY-MM-DD
    const fechaParts = fecha.split('-');
    if (fechaParts.length === 3) {
      const [year, month, day] = fechaParts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    // Si la fecha ya está en formato DD/MM/YYYY o otro formato
    return fecha;
  };

  const fetchLegajos = () => {
  axios.get(`${API_BASE_URL}/legajos`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }).then(res => {
    setLegajos(res.data);
  });
};

  const fetchEmpresas = () => {
  axios.get(`${API_BASE_URL}/legajos/empresas`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then(res => {
      setEmpresas(res.data);
    }).catch(err => {
      console.error('Error al cargar empresas:', err);
    });
  };

  const handleOpen = (legajo = {}) => {
    // Verificar si el admin está intentando editar un legajo de superadmin
    if (user.rol === 'admin_rrhh' && legajo.usuario_rol === 'superadmin') {
      alert('No tienes permisos para editar legajos de superadmin');
      return;
    }
    
    setModoEdicion(!!legajo.id);
    setModoCopia(false);
    setFormData(legajo);
    setOpen(true);
  };

  const handleCopiar = (legajo) => {
    // Crear una copia del legajo manteniendo todos los datos
    // Solo limpiar campos técnicos que no se pueden duplicar
    const legajoCopia = {
      ...legajo,
      // Limpiar solo IDs técnicos (estos son únicos en la base de datos)
      id: undefined,
      usuario_id: undefined,
      // Mantener TODOS los demás datos incluidos los que podrían duplicarse:
      // numero_legajo, nro_documento, cuil, email_personal, etc.
      // El usuario decidirá qué modificar según el caso específico
    };
    
    setModoEdicion(false);
    setModoCopia(true);
    setFormData(legajoCopia);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setModoEdicion(false);
    setModoCopia(false);
    setFormData({});
    setErroresValidacion({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (erroresValidacion[name]) {
      setErroresValidacion(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Función de validación
  const validarFormulario = () => {
    const errores = {};
    
    // Campos obligatorios básicos (siempre requeridos)
    if (!formData.nombre?.trim()) {
      errores.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.apellido?.trim()) {
      errores.apellido = 'El apellido es obligatorio';
    }
    
    // Validaciones específicas para modo creación (nuevo legajo desde cero)
    // En modo copia, los datos ya vienen de un legajo existente válido
    if (!modoEdicion && !modoCopia) {
      // Solo validar estos campos cuando creamos un legajo completamente nuevo
      if (!formData.numero_legajo?.trim()) {
        errores.numero_legajo = 'El número de legajo es obligatorio';
      }
      
      if (!formData.nro_documento?.trim()) {
        errores.nro_documento = 'El DNI es obligatorio';
      } else if (!/^\d{7,8}$/.test(formData.nro_documento)) {
        errores.nro_documento = 'El DNI debe tener 7 u 8 dígitos';
      }
      
      if (!formData.cuil?.trim()) {
        errores.cuil = 'El CUIL es obligatorio';
      } else if (!/^\d{2}-\d{7,8}-\d{1}$/.test(formData.cuil)) {
        errores.cuil = 'El CUIL debe tener el formato XX-XXXXXXXX-X';
      }
      
      if (!formData.email_personal?.trim()) {
        errores.email_personal = 'El email personal es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_personal)) {
        errores.email_personal = 'El email no tiene un formato válido';
      }
    }
    
    // Validaciones de formato cuando los campos tienen contenido (para todos los modos)
    if (formData.nro_documento?.trim() && !/^\d{7,8}$/.test(formData.nro_documento)) {
      errores.nro_documento = 'El DNI debe tener 7 u 8 dígitos';
    }
    
    if (formData.cuil?.trim() && !/^\d{2}-\d{7,8}-\d{1}$/.test(formData.cuil)) {
      errores.cuil = 'El CUIL debe tener el formato XX-XXXXXXXX-X';
    }
    
    if (formData.email_personal?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_personal)) {
      errores.email_personal = 'El email no tiene un formato válido';
    }
    
    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const handleGuardar = () => {
    
    // Validar formulario antes de enviar
    if (!validarFormulario()) {
      // Crear mensaje más específico
      const camposConError = Object.keys(erroresValidacion);
      const mensaje = camposConError.length > 0 
        ? `Por favor, corrija los siguientes errores:\n• ${Object.values(erroresValidacion).join('\n• ')}`
        : 'Por favor, complete todos los campos obligatorios correctamente.';
      
      alert(mensaje);
      return;
    }
    
    // Preparar datos sin campos innecesarios para el backend
    const datosParaEnviar = { ...formData };
    
    // Construir domicilio completo si es necesario
    if (datosParaEnviar.domicilio_calle || datosParaEnviar.domicilio_nro || 
        datosParaEnviar.domicilio_piso || datosParaEnviar.domicilio_dpto) {
      datosParaEnviar.domicilio = construirDomicilioCompleto(
        datosParaEnviar.domicilio_calle,
        datosParaEnviar.domicilio_nro, 
        datosParaEnviar.domicilio_piso,
        datosParaEnviar.domicilio_dpto
      );
    }
    
    // Remover campos undefined o vacíos
    Object.keys(datosParaEnviar).forEach(key => {
      if (datosParaEnviar[key] === undefined || datosParaEnviar[key] === '') {
        delete datosParaEnviar[key];
      }
    });
    
    
    const config = { headers: { Authorization: `Bearer ${getToken()}` } };
    const endpoint = modoEdicion
      ? `${API_BASE_URL}/legajos/${formData.id}`
      : `${API_BASE_URL}/legajos`;

    const metodo = modoEdicion ? axios.put : axios.post;

    metodo(endpoint, datosParaEnviar, config)
      .then(() => {
        handleClose();
        fetchLegajos();
      })
      .catch(err => {
        console.error('Error completo:', err);
        console.error('Respuesta del servidor:', err.response?.data);
        
        if (err.response && err.response.data) {
          const errorData = err.response.data;
          const errorMsg = errorData.error;
          const fieldName = errorData.field;
          const errorType = errorData.type;
          
          let mensajeMostrar = `❌ Error al guardar:\n\n${errorMsg}`;
          
          // Agregar sugerencias específicas basadas en el tipo de error y campo
          if (errorType === 'DUPLICATE_FIELD') {
            switch (fieldName) {
              case 'nro_documento':
                mensajeMostrar += '\n\n💡 Sugerencia: El DNI ya está registrado en el sistema. Verifique que no exista otro legajo con este documento.';
                break;
              case 'numero_legajo':
                mensajeMostrar += '\n\n💡 Sugerencia: El número de legajo ya está en uso. Elija un número diferente.';
                break;
              case 'email_personal':
                mensajeMostrar += '\n\n💡 Sugerencia: El email ya está registrado. Use un email diferente.';
                break;
              case 'cuil':
                mensajeMostrar += '\n\n💡 Sugerencia: El CUIL ya está registrado en el sistema.';
                break;
              default:
                mensajeMostrar += '\n\n💡 Sugerencia: Verifique que los datos no estén duplicados en el sistema.';
            }
          } else if (errorType === 'VALIDATION_ERROR') {
            switch (fieldName) {
              case 'nro_documento':
                mensajeMostrar += '\n\n💡 Sugerencia: El DNI debe tener entre 7 y 8 dígitos numéricos.';
                break;
              case 'cuil':
                mensajeMostrar += '\n\n💡 Sugerencia: El CUIL debe tener el formato XX-XXXXXXXX-X (ej: 20-12345678-9).';
                break;
              case 'email_personal':
                mensajeMostrar += '\n\n💡 Sugerencia: Verifique que el email tenga un formato válido (ej: usuario@dominio.com).';
                break;
              default:
                mensajeMostrar += '\n\n💡 Sugerencia: Verifique que todos los campos cumplan con los formatos requeridos.';
            }
          } else if (errorType === 'CONNECTION_ERROR') {
            mensajeMostrar = '❌ Error de conexión con la base de datos.\n\n💡 Sugerencias:\n• Verifique su conexión a internet\n• Compruebe que el servidor esté funcionando\n• Intente nuevamente en unos minutos';
          } else if (errorType === 'PERMISSION_ERROR') {
            mensajeMostrar = '❌ Error de permisos.\n\n💡 Sugerencia: Contacte al administrador del sistema.';
          } else {
            // Fallback para errores que contengan palabras clave específicas
            if (errorMsg.includes('DNI')) {
              mensajeMostrar += '\n\n💡 Sugerencia: Verifique que el DNI no esté duplicado y tenga el formato correcto (7-8 dígitos)';
            } else if (errorMsg.includes('CUIL')) {
              mensajeMostrar += '\n\n💡 Sugerencia: Verifique que el CUIL tenga el formato XX-XXXXXXXX-X';
            } else if (errorMsg.includes('email')) {
              mensajeMostrar += '\n\n💡 Sugerencia: Verifique que el email tenga un formato válido';
            } else if (errorMsg.includes('número') || errorMsg.includes('legajo')) {
              mensajeMostrar += '\n\n💡 Sugerencia: Verifique que el número de legajo no esté duplicado';
            }
          }
          
          alert(mensajeMostrar);
        } else if (err.response && err.response.status === 503) {
          alert('❌ El servicio no está disponible temporalmente.\n\n💡 Sugerencias:\n• Verifique su conexión a internet\n• El servidor puede estar en mantenimiento\n• Intente nuevamente en unos minutos');
        } else if (err.response && err.response.status === 500) {
          alert('❌ Error interno del servidor.\n\n💡 Sugerencias:\n• Verifique la conexión a la base de datos\n• Contacte al administrador si el problema persiste');
        } else {
          alert('❌ Error al guardar: ' + (err.response?.data?.error || err.message));
        }
      });
  };

  const handleEliminar = (id) => {
    if (window.confirm('¿Eliminar este legajo?')) {
      axios.delete(`${API_BASE_URL}/legajos/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      }).then(() => fetchLegajos())
        .catch(err => alert('Error al eliminar legajo'));
    }
  };

  // Función para convertir fecha de Excel a formato YYYY-MM-DD
  const convertirFechaExcel = (numeroSerie) => {
    if (!numeroSerie || isNaN(numeroSerie)) {
      return null;
    }
    
    // Excel cuenta los días desde el 1 de enero de 1900
    const fechaBase = new Date(1900, 0, 1);
    const diasAjustados = numeroSerie - 2;
    
    const fecha = new Date(fechaBase.getTime() + (diasAjustados * 24 * 60 * 60 * 1000));
    
    // Formatear como YYYY-MM-DD
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
  };

  // Manejar archivo Excel
  const handleArchivoExcel = (event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;

    setArchivoExcel(archivo);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);


        // Detectar columnas disponibles
        const columnasDetectadas = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        setColumnasDetectadas(columnasDetectadas);

        // Detectar información de empresas en los datos
        const empresasEncontradas = new Set();
        jsonData.forEach(fila => {
          // Buscar campos de empresa en diferentes formatos
          const empresa = fila.empresa_id || fila.empresa || fila.empresa_nombre || fila.razon_social || 
                         fila.Empresa || fila.EmpresaID || fila.EMPRESA_ID || fila.RazonSocial;
          if (empresa) {
            empresasEncontradas.add(empresa);
          }
        });
        
        if (empresasEncontradas.size > 0) {
        }

        const datosFormateados = jsonData.map((fila, index) => {
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
          
          // Si no hay columnas separadas, buscar nombre completo y separarlo como último recurso
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
          
          const dni = fila.DocNro || fila.Docnro || fila.docnro || fila.DOCNRO || 
                     fila.doc_nro || fila.DOC_NRO ||
                     fila.documento || fila.Documento || fila.DOCUMENTO ||
                     fila.dni || fila.DNI || fila.Dni ||
                     fila.nro_documento || fila.nroDocumento || '';
          
          const dniLimpio = String(dni || '').trim();
          
          
          if (!dniLimpio || dniLimpio === '' || dniLimpio === 'null' || dniLimpio === 'undefined') {
            console.error('DNI vacío o inválido para:', nombre, apellido);
            return null;
          }

          const nombreLimpio = nombre.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
          
          const apellidoLimpio = apellido.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");

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
          const construirDomicilioCompleto = () => {
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
            legajo: limpiarCampo(fila.Codigo || fila.codigo || fila.CODIGO || fila.Legajo || fila.legajo || fila.LEGAJO || '', 50),
            nro_documento: dniLimpio,
            nombre: limpiarCampo(nombre, 100),
            apellido: limpiarCampo(apellido, 100),
            email_personal: limpiarCampo(fila.Email || fila.email || fila.EMAIL || fila.Correo || fila.correo || fila.CORREO || `${nombreLimpio}.${apellidoLimpio}@temp.com`, 100),
            cuil: limpiarCampo(fila.CUIL || fila.cuil || fila.Cuil || '', 20),
            fecha_nacimiento: fechaConvertida,
            fecha_ingreso: convertirFechaExcel(fila.FecIngreso || fila.fecha_ingreso || fila.fechaIngreso || fila.FechaIngreso || fila.FechaAlta || fila.fecha_alta || fila.FechaIng || fila.fecha_ing || '') || new Date().toISOString().split('T')[0],
            // Campos adicionales del Excel con validación y mapeo correcto
            domicilio: construirDomicilioCompleto(),
            localidad: limpiarCampo(fila.DomicilioLoc || fila.Localidad || fila.localidad || fila.LOCALIDAD || fila.domicilio_localidad || fila.Ciudad || fila.ciudad || '', 100),
            codigo_postal: limpiarCampo(fila.DomicilioCodPos || fila.DomicilioCP || fila.CP || fila.cp || fila.CodigoPostal || fila.codigo_postal || fila.CodPostal || fila.cod_postal || '', 10),
            telefono_contacto: limpiarTelefono(fila.TelContacto || fila.Telefono || fila.telefono || fila.TELEFONO || fila.Tel || fila.Celular || fila.celular || ''),
            contacto_emergencia: limpiarTelefono(fila.TelEmergencia || fila.ContactoEmergencia || fila.contacto_emergencia || fila.Emergencia || fila.TelFamiliar || fila.tel_familiar || ''),
            estado_civil: limpiarCampo(fila.DescEstado || fila.EstCivil || fila.EstadoCivil || fila.estado_civil || fila.ESTADO_CIVIL || fila.EstadoCiv || fila.estado_civ || '', 50),
            cuenta_bancaria: limpiarCampo(fila.CuentaBco || fila.CBU || fila.cbu || fila.CuentaBancaria || fila.cuenta_bancaria || fila.NroCuenta || fila.nro_cuenta || fila.nroctabancaria || '', 30),
            banco_destino: limpiarCampo(fila.DescBco || fila.descbco || fila.DESCBCO || fila.DesBanco || fila.desbanco || fila.DESBANCO || fila.BancoNombre || fila.Banco || fila.banco || fila.BANCO || fila.EntidadBancaria || fila.entidad_bancaria || fila.descbanco || '', 100),
            centro_costos: limpiarCampo(fila.CentroA || fila.centroa || fila.CENTROA || fila.CentroCosto || fila.CentroCostos || fila.centro_costos || fila.CENTRO_COSTOS || fila.CC || fila.cc || fila.cenrtoA || '', 100),
            tarea_desempenada: limpiarCampo(fila.CargoDesc || fila.Cargo || fila.cargo || fila.CARGO || fila.Puesto || fila.puesto || fila.Tarea || fila.tarea || fila.Funcion || fila.funcion || fila.atributoEsp1 || '', 100),
            sexo: limpiarCampo(fila.GeneroDesc || fila.Sexo || fila.sexo || fila.SEXO || fila.Genero || fila.genero || fila.Tipo || fila.tipo || '', 10),
            nacionalidad: limpiarCampo(fila.NacionalidadDesc || fila.Nacionalidad || fila.nacionalidad || fila.NACIONALIDAD || fila.Pais || fila.pais || 'Argentina', 50),
            provincia: limpiarCampo(fila.ProvinciaDesc || fila.Provincia || fila.provincia || fila.PROVINCIA || fila.Prov || fila.prov || '', 50),
            // Campos adicionales que faltan
            apellido_casada: limpiarCampo(fila.ApellidoCasada || fila.apellido_casada || fila.APELLIDO_CASADA || fila.ApellidoMatrimonio || fila.apellido_matrimonio || '', 100),
            domicilio_calle: limpiarCampo(fila.Calle || fila.calle || fila.CALLE || fila.DomicilioCalle || fila.CalleDomicilio || fila.calle_domicilio || '', 200),
            domicilio_nro: limpiarCampo(fila.DomicilioNro || fila.Numero || fila.numero || fila.NUMERO || fila.Nro || fila.nro || fila.NumCalle || fila.num_calle || '', 10),
            domicilio_piso: limpiarCampo(fila.DomicilioPiso || fila.Piso || fila.piso || fila.PISO || fila.NroPiso || fila.nro_piso || '', 10),
            domicilio_dpto: limpiarCampo(fila.DomicilioDpto || fila.Dpto || fila.dpto || fila.DPTO || fila.Departamento || fila.departamento || fila.Unidad || fila.unidad || '', 10),
            tipo_documento: limpiarCampo(fila.TipoDocumento || fila.tipo_documento || fila.TIPO_DOCUMENTO || fila.TipoDoc || fila.tipo_doc || 'DNI', 10),
            // Mapeo de empresa - Soporte para múltiples formatos
            empresa_id: fila.empresa_id || fila.EmpresaID || fila.EMPRESA_ID || fila.EmpresaId || null,
            empresa: limpiarCampo(fila.empresa || fila.Empresa || fila.EMPRESA || '', 100),
            empresa_nombre: limpiarCampo(fila.empresa_nombre || fila.EmpresaNombre || fila.EMPRESA_NOMBRE || '', 100),
            razon_social: limpiarCampo(fila.razon_social || fila.RazonSocial || fila.RAZON_SOCIAL || '', 100)
          };
        }).filter(usuario => usuario !== null);

        setDatosImportar(datosFormateados);
      } catch (error) {
        console.error('Error al procesar el archivo Excel:', error);
        alert('Error al procesar el archivo Excel');
      }
    };
    
    reader.readAsArrayBuffer(archivo);
  };

  // Manejar actualización masiva de legajos
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
      const token = getToken();
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
          
          const response = await axios.post(`${API_BASE_URL}/legajos/actualizar-masivo`, 
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          
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
      fetchLegajos(); // Recargar la lista de legajos
      
    } catch (error) {
      console.error('Error completo:', error);
      alert(error.response?.data?.error || 'Error al actualizar legajos');
    } finally {
      setImportandoEnProgreso(false);
    }
  };

  const columns = [
    { field: 'numero_legajo', headerName: 'N° Legajo', flex: 1, minWidth: 120 },
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 140 },
    { field: 'apellido', headerName: 'Apellido', flex: 1, minWidth: 140 },
    { field: 'nro_documento', headerName: 'DNI', flex: 1, minWidth: 120 },
    { field: 'cuil', headerName: 'CUIL', flex: 1, minWidth: 140 },
    { field: 'email_personal', headerName: 'Email Personal', flex: 1, minWidth: 180 },
    { field: 'domicilio', headerName: 'Domicilio', flex: 1, minWidth: 160 },
    { field: 'localidad', headerName: 'Localidad', flex: 1, minWidth: 140 },
    { field: 'codigo_postal', headerName: 'CP', flex: 1, minWidth: 100 },
    { field: 'telefono_contacto', headerName: 'Teléfono', flex: 1, minWidth: 140 },
    { field: 'contacto_emergencia', headerName: 'Emergencia', flex: 1, minWidth: 140 },
    {
  field: 'fecha_nacimiento',
  headerName: 'Nacimiento',
  flex: 1,
  minWidth: 140,
  renderCell: (params) => {
    return formatearFecha(params.row?.fecha_nacimiento);
  }
},
    { field: 'estado_civil', headerName: 'Estado Civil', flex: 1, minWidth: 140 },
   {
  field: 'fecha_ingreso',
  headerName: 'Ingreso',
  flex: 1,
  minWidth: 140,
  renderCell: (params) => {
    return formatearFecha(params.row?.fecha_ingreso);
  }
},
    { field: 'cuenta_bancaria', headerName: 'Cuenta Bancaria', flex: 1, minWidth: 180 },
    { field: 'banco_destino', headerName: 'Banco', flex: 1, minWidth: 140 },
    { field: 'centro_costos', headerName: 'Centro Costos', flex: 1, minWidth: 160 },
    { field: 'tarea_desempenada', headerName: 'Tarea', flex: 1, minWidth: 160 },
    { field: 'empresa_nombre', headerName: 'Empresa', flex: 1, minWidth: 180 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      sortable: false,
      width: 150,
      renderCell: (params) => {
        // Verificar si el legajo pertenece a un superadmin
        const esSuperAdmin = params.row.usuario_rol === 'superadmin';
        const puedeEditar = user.rol === 'superadmin' || !esSuperAdmin;
        
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={!puedeEditar ? 'No puedes editar legajos de superadmin' : 'Editar legajo'}>
              <span>
                <IconButton 
                  color="primary"
                  size="small" 
                  onClick={() => handleOpen(params.row)}
                  disabled={!puedeEditar}
                  sx={{ 
                    bgcolor: puedeEditar ? 'primary.50' : 'grey.200',
                    '&:hover': { bgcolor: puedeEditar ? 'primary.100' : 'grey.200' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Copiar legajo para crear uno nuevo">
              <IconButton 
                color="secondary"
                size="small" 
                onClick={() => handleCopiar(params.row)}
                sx={{ 
                  bgcolor: 'secondary.50',
                  '&:hover': { bgcolor: 'secondary.100' }
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {user.rol === 'superadmin' && (
              <Tooltip title="Eliminar legajo">
                <IconButton 
                  color="error"
                  size="small"
                  onClick={() => handleEliminar(params.row.id)}
                  sx={{ 
                    bgcolor: 'error.50',
                    '&:hover': { bgcolor: 'error.100' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ];

  const legajosFiltrados = legajos.filter(l =>
    l.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.nro_documento?.toString().includes(busqueda) ||
    l.numero_legajo?.toString().includes(busqueda)
  );

  if (!user || (user.rol !== 'admin_rrhh' && user.rol !== 'superadmin')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: '#1976d2',
          mb: 3
        }}
      >
        Gestión de Legajos
      </Typography>

        <Box sx={{
          mb: 3,
          '& .MuiTextField-root': {
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'white',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
              '&.Mui-focused': {
                backgroundColor: 'white',
                boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
              }
            }
          }
        }}>
          <TextField
            label="Buscar por apellido, DNI o N° de legajo"
            variant="outlined"
            size="small"
            fullWidth
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </Box>

        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          '& .MuiButton-root': {
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minHeight: 42,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              transition: 'all 0.3s ease'
            }
          }
        }}>
          <Button
            variant="contained"
            startIcon={<PeopleIcon />}
            onClick={() => setShowLegajos(true)}
            color="secondary"
          >
            MIS LEGAJOS
          </Button>
          {user.rol === 'superadmin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            color="primary"
          >
            Crear Usuario
          </Button>
           )}
          {user.rol === 'superadmin' && (
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setOpenImportar(true)}
              sx={{
                backgroundColor: '#ff9800',
                '&:hover': {
                  backgroundColor: '#f57c00',
                }
              }}
            >
              Importar Masivo
            </Button>
          )}
        </Box>

        <Box sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          width: 'fit-content',
          maxWidth: '100%',
          margin: '0 auto'
        }}>
          <DataGrid
            rows={legajosFiltrados}
            columns={columns}
            autoHeight
            pageSize={10}
            getRowId={(row) => row.id}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#1976d2 !important',
                color: 'white !important',
                fontWeight: 600,
                fontSize: '0.9rem',
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: '#1976d2 !important',
                  color: 'white !important',
                  '& *': {
                    color: 'white !important',
                  }
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  color: 'white !important',
                  fontWeight: 600,
                },
                '& .MuiDataGrid-iconSeparator': {
                  color: 'white !important',
                },
                '& .MuiDataGrid-sortIcon': {
                  color: 'white !important',
                },
                '& .MuiDataGrid-menuIcon': {
                  color: 'white !important',
                },
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                  color: 'white !important',
                }
              },
              '& .MuiDataGrid-row': {
                '&:nth-of-type(even)': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                },
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  transform: 'scale(1.001)',
                  transition: 'all 0.2s ease',
                }
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                fontSize: '0.85rem',
                padding: '8px 12px',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }
            }}
          />
        </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {modoEdicion ? 'Editar Legajo' : modoCopia ? 'Copiar Legajo' : 'Nuevo Legajo'}
        </DialogTitle>
        <DialogContent>
          {modoCopia && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1 }}>
              <Typography variant="body2">
                📋 <strong>Modo Copia:</strong> Se han copiado TODOS los datos del legajo seleccionado.
                <br />
                <strong>🎯 Uso recomendado:</strong> Para empleados existentes que necesitan un nuevo legajo (cambio de empresa, reingreso, etc.).
                <br />
                <strong>✏️ Modifique solo los campos necesarios</strong> como N° Legajo, empresa, o datos que hayan cambiado.
              </Typography>
            </Box>
          )}
          <TextField 
            fullWidth 
            label="Nombre" 
            name="nombre" 
            value={formData.nombre || ''} 
            onChange={handleChange} 
            margin="normal"
            error={!!erroresValidacion.nombre}
            helperText={erroresValidacion.nombre}
            required
          />
          <TextField 
            fullWidth 
            label="Apellido" 
            name="apellido" 
            value={formData.apellido || ''} 
            onChange={handleChange} 
            margin="normal"
            error={!!erroresValidacion.apellido}
            helperText={erroresValidacion.apellido}
            required
          />
          <TextField 
            fullWidth 
            label="N° Legajo" 
            name="numero_legajo" 
            value={formData.numero_legajo || ''} 
            onChange={handleChange} 
            margin="normal"
            error={!!erroresValidacion.numero_legajo}
            helperText={erroresValidacion.numero_legajo}
            required={!modoEdicion && !modoCopia}
          />
          <TextField 
            fullWidth 
            label="DNI" 
            name="nro_documento" 
            value={formData.nro_documento || ''} 
            onChange={handleChange} 
            margin="normal"
            error={!!erroresValidacion.nro_documento}
            helperText={erroresValidacion.nro_documento}
            required={!modoEdicion && !modoCopia}
            placeholder="12345678"
          />
          <TextField 
            fullWidth 
            label="CUIL" 
            name="cuil" 
            value={formData.cuil || ''} 
            onChange={handleChange} 
            margin="normal"
            error={!!erroresValidacion.cuil}
            helperText={erroresValidacion.cuil}
            required={!modoEdicion && !modoCopia}
            placeholder="20-12345678-9"
          />
          <TextField 
            fullWidth 
            label="Email Personal" 
            name="email_personal" 
            value={formData.email_personal || ''} 
            onChange={handleChange} 
            margin="normal"
            type="email"
            error={!!erroresValidacion.email_personal}
            helperText={erroresValidacion.email_personal}
            required={!modoEdicion && !modoCopia}
            placeholder="ejemplo@email.com"
          />
          <TextField fullWidth label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" InputLabelProps={{ shrink: true }} value={formData.fecha_nacimiento?.slice(0, 10) || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Estado Civil" name="estado_civil" value={formData.estado_civil || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Fecha de Ingreso" name="fecha_ingreso" type="date" InputLabelProps={{ shrink: true }} value={formData.fecha_ingreso?.slice(0, 10) || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Domicilio" name="domicilio" value={formData.domicilio || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Localidad" name="localidad" value={formData.localidad || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Código Postal" name="codigo_postal" value={formData.codigo_postal || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Teléfono Contacto" name="telefono_contacto" value={formData.telefono_contacto || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Contacto Emergencia" name="contacto_emergencia" value={formData.contacto_emergencia || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Cuenta Bancaria" name="cuenta_bancaria" value={formData.cuenta_bancaria || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Banco Destino" name="banco_destino" value={formData.banco_destino || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Centro de Costos" name="centro_costos" value={formData.centro_costos || ''} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Tarea Desempeñada" name="tarea_desempenada" value={formData.tarea_desempenada || ''} onChange={handleChange} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Empresa</InputLabel>
            <Select
              name="empresa_id"
              value={formData.empresa_id || ''}
              onChange={handleChange}
              label="Empresa"
            >
              <MenuItem value="">
                <em>Sin empresa asignada</em>
              </MenuItem>
              {empresas.map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Importación Masiva de Legajos */}
      <Dialog open={openImportar} onClose={() => setOpenImportar(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Actualización Masiva de Legajos</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>🔄 Usa el mismo archivo Excel que usaste para importar usuarios</strong>
            <br />
            Esta función toma el archivo Excel de importación de usuarios y actualiza los legajos con todos los campos adicionales que no se procesan al crear el usuario inicial.
            <br /><br />
            <strong>Campos obligatorios para identificar usuarios:</strong>
            <br />
            • <strong>codigo</strong> (legajo del usuario existente)
            <br />
            • <strong>Docnro</strong> (DNI del usuario existente)
            <br />
            <strong>Campos adicionales que se actualizarán en el legajo:</strong>
            <br />
            • <strong>Datos personales:</strong> CUIL, FecNacimiento, Sexo, Nacionalidad, EstadoCivil
            <br />
            • <strong>Ubicación:</strong> Domicilio, Localidad, CP, Provincia  
            <br />
            • <strong>Contacto:</strong> Telefono, ContactoEmergencia
            <br />
            • <strong>Datos laborales:</strong> CentroCostos, Cargo
            <br />
            • <strong>Datos bancarios:</strong> CBU, Banco
            <br />
            <em>✅ Esta función completa la información de legajos que no se carga al crear usuarios inicialmente.</em>
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>¿Qué hace esta función?</strong>
              <br />
              • Busca usuarios existentes por número de legajo
              <br />
              • Actualiza o crea sus legajos con los datos del Excel
              <br />
              • Convierte automáticamente las fechas de Excel al formato correcto
              <br />
              • Útil para completar datos faltantes en legajos existentes
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
                📁 Archivo seleccionado: {archivoExcel.name}
              </Typography>
            )}

            {columnasDetectadas.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>📋 Columnas detectadas ({columnasDetectadas.length}):</strong><br />
                  {columnasDetectadas.join(', ')}
                </Typography>
                {/* Mostrar información específica sobre empresas si se detectan */}
                {columnasDetectadas.some(col => 
                  ['empresa_id', 'empresa', 'empresa_nombre', 'razon_social', 'EmpresaID', 'EMPRESA_ID'].some(pattern => 
                    col.toLowerCase().includes(pattern.toLowerCase())
                  )
                ) && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'success.main', fontWeight: 'medium' }}>
                    ✅ <strong>Se detectaron columnas de empresa</strong> - Los legajos se asignarán automáticamente a sus empresas
                  </Typography>
                )}
              </Alert>
            )}
          </Box>

          {datosImportar.length > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Se procesarán {datosImportar.length} legajos
            </Alert>
          )}

          {/* Vista previa de datos */}
          {datosImportar.length > 0 && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Vista previa de datos ({datosImportar.length} legajos)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {datosImportar.slice(0, 8).map((legajo, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                        <strong>Legajo:</strong> {legajo.legajo} | 
                        <strong> DNI:</strong> {legajo.dni || legajo.nro_documento} | 
                        <strong> Nombre:</strong> {legajo.nombre} {legajo.apellido}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        <strong>Email:</strong> {legajo.correo || legajo.email_personal || 'N/A'} | 
                        <strong> CUIL:</strong> {legajo.cuil || 'N/A'} |
                        <strong> Fecha Nac:</strong> {formatearFecha(legajo.fecha_nacimiento) || 'No especificada'}
                      </Typography>
                      
                      {/* Información de empresa */}
                      {(legajo.empresa_id || legajo.empresa || legajo.empresa_nombre || legajo.razon_social) && (
                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'medium', mb: 0.5 }}>
                          <strong>🏢 Empresa:</strong> {
                            legajo.empresa_nombre || legajo.empresa || legajo.razon_social || 
                            (legajo.empresa_id ? `ID: ${legajo.empresa_id}` : 'N/A')
                          }
                          {legajo.empresa_id && ` (ID: ${legajo.empresa_id})`}
                        </Typography>
                      )}
                      
                      {(legajo.domicilio || legajo.localidad || legajo.telefono || legajo.telefono_contacto) && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          <strong>📍 Domicilio:</strong> {legajo.domicilio || 'N/A'} | 
                          <strong> Localidad:</strong> {legajo.localidad || 'N/A'} |
                          <strong> 📱 Tel:</strong> {legajo.telefono || legajo.telefono_contacto || 'N/A'}
                        </Typography>
                      )}
                      
                      {(legajo.cargo || legajo.tarea || legajo.centro_costos || legajo.centro_costo || legajo.sexo) && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          <strong>💼 Cargo:</strong> {legajo.cargo || legajo.tarea || legajo.tarea_desempenada || 'N/A'} | 
                          <strong> Centro:</strong> {legajo.centro_costos || legajo.centro_costo || 'N/A'} |
                          <strong> Sexo:</strong> {legajo.sexo || legajo.genero || 'N/A'}
                        </Typography>
                      )}
                      
                      {(legajo.cuenta_bancaria || legajo.cbu || legajo.banco || legajo.banco_destino) && (
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.85em' }}>
                          <strong>💳 CBU:</strong> {legajo.cuenta_bancaria || legajo.cbu || 'N/A'} | 
                          <strong> Banco:</strong> {legajo.banco || legajo.banco_destino || 'N/A'}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {datosImportar.length > 8 && (
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 2, fontStyle: 'italic' }}>
                      ... y {datosImportar.length - 8} legajos más
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Mostrar resultado de la importación */}
          {resultadoImportacion && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={resultadoImportacion.errores?.length > 0 ? "warning" : "success"}>
                <Typography variant="h6">Resultado de la actualización:</Typography>
                <Typography>✅ Exitosos: {resultadoImportacion.exitosos}</Typography>
                <Typography>📊 Total procesados: {resultadoImportacion.totalProcesados}</Typography>
                {resultadoImportacion.errores?.length > 0 && (
                  <Typography>❌ Errores: {resultadoImportacion.errores.length}</Typography>
                )}
                {resultadoImportacion.advertencias?.length > 0 && (
                  <Typography>⚠️ Advertencias: {resultadoImportacion.advertencias.length}</Typography>
                )}
              </Alert>

              {resultadoImportacion.errores?.length > 0 && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography color="error">Ver errores ({resultadoImportacion.errores.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {resultadoImportacion.errores.map((error, index) => (
                        <Typography key={index} variant="body2" color="error" sx={{ mb: 1 }}>
                          Fila {error.fila}: {error.error} - {error.usuario}
                        </Typography>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}

          {/* Barra de progreso */}
          {importandoEnProgreso && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Actualizando legajos: {progresoImportacion} / {totalImportacion}
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
            setProgresoImportacion(0);
            setTotalImportacion(0);
          }}
          disabled={importandoEnProgreso}
          >
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleActualizarLegajos}
            disabled={datosImportar.length === 0 || importandoEnProgreso}
          >
            {importandoEnProgreso ? 'Actualizando...' : 'Actualizar Legajos Masivo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Gestión de Legajos */}
      <GestionLegajos 
        open={showLegajos} 
        onClose={() => setShowLegajos(false)} 
      />
    </Box>
  );
};

export default LegajoAdmin;
