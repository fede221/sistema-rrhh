import { API_BASE_URL, getApiBaseUrl } from '../../config';
import React, { useState, useEffect } from 'react';
import { getToken, getUser } from '../../utils/auth';
import usePermisos from '../../hooks/usePermisos';
import { 
  Modal, 
  TextField, 
  MenuItem, 
  LinearProgress, 
  Typography, 
  Box, 
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardActions,
  Stack,
  Tooltip,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Create as CreateIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import HistorialImportaciones from '../../components/HistorialImportaciones';
import GestionEmpresas from './GestionEmpresas';

const months = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const Recibos = () => {
  const { tienePermiso } = usePermisos();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Función helper global para formatear fechas de manera segura
  const formatFechaSegura = (fecha) => {
    if (!fecha) return '';
    
    // Si es un objeto Date, convertirlo usando métodos que eviten problemas de timezone
    if (fecha instanceof Date) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    
    // Si no es string, convertirlo a string
    if (typeof fecha !== 'string') {
      console.warn('formatFechaSegura recibió un valor no string:', fecha);
      fecha = String(fecha);
    }
    
    // Si la fecha viene en formato ISO con timezone, extraer solo la parte de fecha
    if (fecha.includes('T')) {
      const [y, m, d] = fecha.split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    }
    
    // Si la fecha viene en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, m, d] = fecha.split('-');
      return `${d}/${m}/${y}`;
    }
    
    // Si ya está en formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      return fecha;
    }
    
    return fecha;
  };
  
  // Función para formatear números con punto de miles y coma decimal (formato argentino)
  const formatNumber = (num) => {
    if (!num || isNaN(num)) return '';
    const number = parseFloat(num);
    if (number === 0) return '';
    return number.toLocaleString('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Genera el HTML del recibo con leyenda y firma del empleado
  const generarHtmlReciboEmpleado = async (periodo, registros) => {
    const base = await generarHtmlRecibo(periodo, registros);
    // Datos del empleado y fecha/hora de la firma desde BD
    const nombre = registros[0]?.Nombre || '';
    const fechaFirmaDB = registros[0]?.fecha_firma;
    const fechaFirma = fechaFirmaDB ? new Date(fechaFirmaDB).toLocaleString('es-AR', { hour12: false }) : new Date().toLocaleString('es-AR', { hour12: false });
    
    // Obtener la URL base para construir rutas completas
    const baseUrl = getApiBaseUrl();
    const firmaUrl = registros[0]?.empresa_firma_url;
    let firmaBase64 = null;
    
    if (firmaUrl) {
      const fullFirmaUrl = firmaUrl.startsWith('http') ? firmaUrl : `${baseUrl}${firmaUrl}`;
      // Convertir imagen a base64 para embeberla en el HTML
      firmaBase64 = await imageToBase64(fullFirmaUrl);
    }
    
    return base
      .replace(
        /<div class="leyenda">[\s\S]*?<\/div>\s*<div class="firmas">[\s\S]*?<\/div>\s*<\/section>/,
        `<div class="leyenda">RECIBÍ DE CONFORMIDAD EL IMPORTE DE LA PRESENTE LIQUIDACIÓN EN PAGO DE MI REMUNERACIÓN CORRESPONDIENTE AL PERÍODO ARRIBA INDICADO Y COPIA DE ESTE RECIBO</div>
           <div class="firmas" style="display:flex;justify-content:flex-end;margin-top:20px;">
        <div class="sign no-line" style="margin-top:40px;text-align:center;margin-right:50px;">
          <div style="font-weight:bold;font-size:13px;">${nombre}</div>
          <div style="font-size:11px;color:#444;">Firmado digitalmente el ${fechaFirma}</div>
          <div style="width:220px;height:1px;border-bottom:1px solid #222;margin:16px auto 8px auto;"></div>
          <div style="margin-top:8px;">FIRMA DEL EMPLEADO</div>
        </div>
       </div>
    </section>`
      );
  };

  // Función para imprimir recibo firmado por el empleado
  const handleImprimirReciboEmpleado = async (claveGrupoOPeriodo) => {
    // Si viene con _, es una clave compuesta; si no, es solo período (llamadas antiguas)
    let periodo, tipoLiquidacion;
    if (claveGrupoOPeriodo.includes('_')) {
      [periodo, tipoLiquidacion] = claveGrupoOPeriodo.split('_');
    } else {
      periodo = claveGrupoOPeriodo;
      tipoLiquidacion = null; // No filtrar por tipo
    }
    
    const registros = (Array.isArray(recibosFiltrados) ? recibosFiltrados : []).filter(r => {
      const coincidePeriodo = r.PeriodoLiquidacion === periodo;
      if (tipoLiquidacion) {
        return coincidePeriodo && (r.tipo_liquidacion || 'mensual') === tipoLiquidacion;
      }
      return coincidePeriodo;
    });
    
    if (registros.length === 0) return;
    
    // Agrupar por legajo si hay múltiples
    const legajosUnicos = [...new Set(registros.map(r => r.Legajo).filter(Boolean))];
    
    if (legajosUnicos.length > 1) {
      // Generar recibos separados para cada legajo
      for (const legajo of legajosUnicos) {
        const registrosLegajo = registros.filter(r => r.Legajo === legajo);
        const printWindow = window.open('', '_blank');
        const reciboHtml = await generarHtmlReciboEmpleado(periodo, registrosLegajo);
        printWindow.document.write(reciboHtml);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500 * legajosUnicos.indexOf(legajo));
        };
      }
    } else {
      // Lógica original para un solo legajo
      const printWindow = window.open('', '_blank');
      const reciboHtml = await generarHtmlReciboEmpleado(periodo, registros);
      printWindow.document.write(reciboHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };
    }
  };
  const user = getUser && getUser();
  const isAdmin = user && (user.rol === 'admin' || user.rol === 'superadmin' || user.rol === 'admin_rrhh');

  // Estados para consulta y agrupación
  const [recibos, setRecibos] = useState([]);
  const [agrupados, setAgrupados] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [firma, setFirma] = useState({});
  const [firmaModal, setFirmaModal] = useState({ open: false, periodo: null });
  const [firmaPassword, setFirmaPassword] = useState('');
  const [firmaError, setFirmaError] = useState('');

  // Estados para el modal de importación
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);
  const [periodo, setPeriodo] = useState('');
  const [anio, setAnio] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [tipoLiquidacion, setTipoLiquidacion] = useState('mensual');
  const [progress, setProgress] = useState(null);
  const [polling, setPolling] = useState(false);
  const [currentImportId, setCurrentImportId] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showEmpresas, setShowEmpresas] = useState(false);
  
  // Estados para manejo de empresas y legajos del usuario
  const [misLegajos, setMisLegajos] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('todas');
  const [legajoSeleccionado, setLegajoSeleccionado] = useState('');

  // Cargar legajos del usuario
  const fetchMisLegajos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/legajos/mis-legajos`, {
        headers: { Authorization: `Bearer ${getToken && getToken()}` }
      });
      if (res.ok) {
        const legajos = await res.json();
        setMisLegajos(legajos);
      }
    } catch (err) {
      console.error('Error cargando legajos:', err);
    }
  };

  useEffect(() => {
    const fetchRecibos = async () => {
      try {
  const res = await fetch(`${API_BASE_URL}/api/recibos/mis-recibos`, {
          headers: { Authorization: `Bearer ${getToken && getToken()}` }
        });
        const data = await res.json();
        setRecibos(data);
        
        // Inicializar estado de firmas con datos de la BD
        const firmasEstado = {};
        const agrupados = {};
        data.forEach(r => {
          // Crear clave única combinando período y tipo de liquidación
          const claveGrupo = `${r.PeriodoLiquidacion}_${r.tipo_liquidacion || 'mensual'}`;
          if (!agrupados[claveGrupo]) {
            agrupados[claveGrupo] = [];
            // Si cualquier recibo del período está firmado, considerar todo el período firmado
            firmasEstado[claveGrupo] = false;
          }
          agrupados[claveGrupo].push(r);
          // Si al menos un recibo está firmado, el período está firmado
          if (r.Firmado === 1) {
            firmasEstado[claveGrupo] = true;
          }
        });
        
        setFirma(firmasEstado);
        setAgrupados(Object.entries(agrupados));
      } catch (err) {
        setRecibos([]);
      }
    };
    
    fetchRecibos();
    fetchMisLegajos();
  }, []);

  // Prevenir gestos de swipe de navegación en móviles
  useEffect(() => {
    if (isMobile) {
      let startX = null;
      let startY = null;

      const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };

      const handleTouchMove = (e) => {
        if (!startX || !startY) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);
        
        // Solo prevenir si es un movimiento principalmente horizontal
        // y está cerca del borde de la pantalla (posible navegación)
        if (deltaX > deltaY && deltaX > 50) {
          const isLeftEdge = startX < 50; // Swipe desde borde izquierdo
          const isRightEdge = startX > window.innerWidth - 50; // Swipe desde borde derecho
          
          if (isLeftEdge || isRightEdge) {
            e.preventDefault();
          }
        }
      };

      const handleTouchEnd = () => {
        startX = null;
        startY = null;
      };

      // Solo aplicar estilos CSS mínimos necesarios
      const originalBodyStyle = {
        overscrollBehaviorX: document.body.style.overscrollBehaviorX
      };

      document.body.style.overscrollBehaviorX = 'none';

      // Agregar event listeners con passive: false solo para touchmove
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });

      // Cleanup al desmontar el componente
      return () => {
        // Restaurar estilos originales
        document.body.style.overscrollBehaviorX = originalBodyStyle.overscrollBehaviorX;

        // Remover event listeners
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isMobile]);

  // Filtrar recibos por empresa seleccionada
  const recibosFiltrados = React.useMemo(() => {
    if (empresaSeleccionada === 'todas' || !empresaSeleccionada) {
      return recibos;
    }
    
    // Obtener los legajos de la empresa seleccionada
    const legajosEmpresa = misLegajos
      .filter(l => l.empresa_id.toString() === empresaSeleccionada)
      .map(l => l.numero_legajo);
    
    return recibos.filter(r => legajosEmpresa.includes(r.Legajo));
  }, [recibos, empresaSeleccionada, misLegajos]);

  // Actualizar agrupados cuando cambien los recibos filtrados
  const agrupadosFiltrados = React.useMemo(() => {
    const firmasEstado = {};
    const agrupados = {};
    
    recibosFiltrados.forEach(r => {
      // Crear clave única combinando período y tipo de liquidación
      const claveGrupo = `${r.PeriodoLiquidacion}_${r.tipo_liquidacion || 'mensual'}`;
      if (!agrupados[claveGrupo]) {
        agrupados[claveGrupo] = [];
        firmasEstado[claveGrupo] = false;
      }
      agrupados[claveGrupo].push(r);
      if (r.Firmado === 1) {
        firmasEstado[claveGrupo] = true;
      }
    });
    
    // Actualizar el estado de firmas
    setFirma(prev => ({ ...prev, ...firmasEstado }));
    
    return Object.entries(agrupados);
  }, [recibosFiltrados]);

  const handleCloseDetalle = () => {
    setOpenDetalle(false);
    setDetalle(null);
  };

  // Función para imprimir recibo de una empresa específica
  const handleImprimirReciboPorEmpresa = async (claveGrupoOPeriodo, empresaId) => {
    // Si viene con _, es una clave compuesta; si no, es solo período (llamadas antiguas)
    let periodo, tipoLiquidacion;
    if (claveGrupoOPeriodo.includes('_')) {
      [periodo, tipoLiquidacion] = claveGrupoOPeriodo.split('_');
    } else {
      periodo = claveGrupoOPeriodo;
      tipoLiquidacion = null; // No filtrar por tipo
    }
    
    const registros = recibosFiltrados.filter(r => {
      const coincidePeriodo = r.PeriodoLiquidacion === periodo;
      if (tipoLiquidacion) {
        return coincidePeriodo && (r.tipo_liquidacion || 'mensual') === tipoLiquidacion;
      }
      return coincidePeriodo;
    });
    
    const legajosEmpresa = misLegajos
      .filter(l => l.empresa_id === empresaId)
      .map(l => l.numero_legajo);
    
    const registrosEmpresa = registros.filter(r => legajosEmpresa.includes(r.Legajo));
    
    if (registrosEmpresa.length === 0) return;

    // Obtener información de la empresa desde misLegajos
    let empresaInfo = misLegajos.find(l => l.empresa_id === empresaId);
    
    // Si no encuentra, intentar con conversión de tipos
    if (!empresaInfo) {
      empresaInfo = misLegajos.find(l => String(l.empresa_id) === String(empresaId));
    }
    
    const printWindow = window.open('', '_blank');
    const reciboHtml = await generarHtmlRecibo(periodo, registrosEmpresa, empresaInfo);
    printWindow.document.write(reciboHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  // Función para verificar si se puede ver un recibo
  const puedeVerRecibo = (claveGrupo) => {
    // Ordenar períodos de más antiguo a más nuevo
    const periodosOrdenados = agrupadosFiltrados
      .map(([clave]) => clave)
      .sort((a, b) => {
        // Extraer solo el período para la comparación
        const [periodoA] = a.split('_');
        const [periodoB] = b.split('_');
        const [mesA, anioA] = periodoA.split('/').map(Number);
        const [mesB, anioB] = periodoB.split('/').map(Number);
        return anioA !== anioB ? anioA - anioB : mesA - mesB;
      });

    const indicePeriodo = periodosOrdenados.indexOf(claveGrupo);
    
    // Si es el primer período o todos los anteriores están firmados
    if (indicePeriodo === 0) return true;
    
    // Verificar que todos los períodos anteriores estén firmados
    for (let i = 0; i < indicePeriodo; i++) {
      if (!firma[periodosOrdenados[i]]) {
        return false;
      }
    }
    
    return true;
  };

  const handleVerDetalle = (claveGrupo) => {
    if (!puedeVerRecibo(claveGrupo)) {
      alert('Para ver este recibo, primero debe firmar todos los recibos anteriores.');
      return;
    }
    
    // Extraer período y tipo de liquidación
    const [periodo, tipoLiquidacion] = claveGrupo.split('_');
    const registros = recibosFiltrados.filter(r => 
      r.PeriodoLiquidacion === periodo && 
      (r.tipo_liquidacion || 'mensual') === tipoLiquidacion
    );
    setDetalle({ periodo: `${periodo} (${tipoLiquidacion === 'sac' ? 'SAC' : 'Mensual'})`, registros });
    setOpenDetalle(true);
  };

  // Abrir modal de firma
  const handleFirmar = (claveGrupo) => {
    setFirmaModal({ open: true, periodo: claveGrupo });
    setFirmaPassword('');
    setFirmaError('');
  };

  // Enviar firma al backend
  const handleFirmaSubmit = async () => {
    if (!firmaPassword) {
      setFirmaError('Ingresá tu contraseña');
      return;
    }
    
    try {
      // Extraer período y tipo de liquidación de la clave
      const [periodo, tipoLiquidacion] = firmaModal.periodo.split('_');
      
      // Obtener todos los recibos del período para este usuario
      const recibosDelPeriodo = recibosFiltrados.filter(r => 
        r.PeriodoLiquidacion === periodo && 
        (r.tipo_liquidacion || 'mensual') === tipoLiquidacion
      );
      const legajosUnicos = [...new Set(recibosDelPeriodo.map(r => r.Legajo).filter(Boolean))];
      
      // Si hay múltiples legajos, firmar cada uno por separado
      if (legajosUnicos.length > 1) {
        let todasLasFirmasExitosas = true;
        
        for (const legajo of legajosUnicos) {
          const res = await fetch(`${API_BASE_URL}/api/recibos/firmar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getToken && getToken()}`
            },
            body: JSON.stringify({ 
              periodo: periodo, // Usar solo el período para el backend 
              password: firmaPassword,
              legajo: legajo
            })
          });
          
          const data = await res.json();
          if (!res.ok || !data.success) {
            todasLasFirmasExitosas = false;
            setFirmaError(data.error || `Error al firmar recibo del legajo ${legajo}`);
            break;
          }
        }
        
        if (todasLasFirmasExitosas) {
          setFirma(f => ({ ...f, [firmaModal.periodo]: true }));
          setFirmaModal({ open: false, periodo: null });
          // Recargar recibos para obtener los estados actualizados
          window.location.reload();
        }
      } else {
        // Lógica original para un solo legajo
        const res = await fetch(`${API_BASE_URL}/api/recibos/firmar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken && getToken()}`
          },
          body: JSON.stringify({ 
            periodo: periodo, // Usar solo el período para el backend
            password: firmaPassword,
            legajo: legajosUnicos[0] || null
          })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          setFirma(f => ({ ...f, [firmaModal.periodo]: true }));
          setFirmaModal({ open: false, periodo: null });
        } else {
          setFirmaError(data.error || 'Contraseña incorrecta');
        }
      }
    } catch (err) {
      console.error('Error al firmar:', err);
      setFirmaError('Error al firmar el recibo');
    }
  };

  // Función para imprimir/descargar PDF
  const handleImprimirRecibo = async (claveGrupoOPeriodo) => {
    // Si viene con _, es una clave compuesta; si no, es solo período (llamadas antiguas)
    let periodo, tipoLiquidacion;
    if (claveGrupoOPeriodo.includes('_')) {
      [periodo, tipoLiquidacion] = claveGrupoOPeriodo.split('_');
    } else {
      periodo = claveGrupoOPeriodo;
      tipoLiquidacion = null; // No filtrar por tipo
    }
    
    const registros = recibosFiltrados.filter(r => {
      const coincidePeriodo = r.PeriodoLiquidacion === periodo;
      if (tipoLiquidacion) {
        return coincidePeriodo && (r.tipo_liquidacion || 'mensual') === tipoLiquidacion;
      }
      return coincidePeriodo;
    });
    
    if (registros.length === 0) return;

    // Agrupar por empresa y legajo
    const empresasUnicas = [...new Set(registros.map(r => r.empresa_nombre || 'Sin Empresa'))];
    
    if (empresasUnicas.length > 1) {
      // Generar recibos separados por empresa
      const promises = empresasUnicas.map(async (empresaNombre, index) => {
        const registrosEmpresa = registros.filter(r => 
          (r.empresa_nombre || 'Sin Empresa') === empresaNombre
        );
        
        const reciboHtml = await generarHtmlRecibo(periodo, registrosEmpresa);
        
        return { html: reciboHtml, index };
      });
      
      const resultados = await Promise.all(promises);
      
      resultados.forEach(({ html, index }) => {
        setTimeout(() => {
          const printWindow = window.open('', '_blank');
          printWindow.document.write(html);
          printWindow.document.close();
          
          // Esperar a que cargue y luego imprimir
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };
        }, 500 * index); // Retrasar cada impresión para evitar conflictos
      });
    } else {
      // Una sola empresa o sin empresa
      const printWindow = window.open('', '_blank');
      const reciboHtml = await generarHtmlRecibo(periodo, registros);
      
      printWindow.document.write(reciboHtml);
      printWindow.document.close();
      
      // Esperar a que cargue y luego imprimir
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        // Cerrar la ventana después de imprimir (opcional)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };
    }
  };

  // Función para ver PDF sin imprimir automáticamente
  const handleVerPdf = async (claveGrupoOPeriodo) => {
    // Si viene con _, es una clave compuesta; si no, es solo período (llamadas antiguas)
    let periodo, tipoLiquidacion;
    if (claveGrupoOPeriodo.includes('_')) {
      [periodo, tipoLiquidacion] = claveGrupoOPeriodo.split('_');
    } else {
      periodo = claveGrupoOPeriodo;
      tipoLiquidacion = null; // No filtrar por tipo
    }
    
    const registros = recibosFiltrados.filter(r => {
      const coincidePeriodo = r.PeriodoLiquidacion === periodo;
      if (tipoLiquidacion) {
        return coincidePeriodo && (r.tipo_liquidacion || 'mensual') === tipoLiquidacion;
      }
      return coincidePeriodo;
    });
    
    if (registros.length === 0) return;

    // Agrupar por empresa y legajo
    const empresasUnicas = [...new Set(registros.map(r => r.empresa_nombre || 'Sin Empresa'))];
    
    if (empresasUnicas.length > 1) {
      // Generar recibos separados por empresa
      empresasUnicas.forEach(async (empresaNombre, index) => {
        const registrosEmpresa = registros.filter(r => 
          (r.empresa_nombre || 'Sin Empresa') === empresaNombre
        );
        
        const reciboHtml = await generarHtmlRecibo(periodo, registrosEmpresa);
        
        setTimeout(() => {
          const pdfWindow = window.open('', '_blank');
          pdfWindow.document.write(reciboHtml);
          pdfWindow.document.close();
          
          // Solo enfocar la ventana, sin imprimir
          pdfWindow.onload = () => {
            pdfWindow.focus();
          };
        }, 100 * index); // Menor retraso porque no imprimimos
      });
    } else {
      // Una sola empresa o sin empresa
      const pdfWindow = window.open('', '_blank');
      const reciboHtml = await generarHtmlRecibo(periodo, registros);
      
      pdfWindow.document.write(reciboHtml);
      pdfWindow.document.close();
      
      // Solo enfocar la ventana, sin imprimir
      pdfWindow.onload = () => {
        pdfWindow.focus();
      };
    }
  };

  // Función para ver PDF del empleado sin imprimir automáticamente
  const handleVerPdfEmpleado = async (claveGrupoOPeriodo) => {
    // Si viene con _, es una clave compuesta; si no, es solo período (llamadas antiguas)
    let periodo, tipoLiquidacion;
    if (claveGrupoOPeriodo.includes('_')) {
      [periodo, tipoLiquidacion] = claveGrupoOPeriodo.split('_');
    } else {
      periodo = claveGrupoOPeriodo;
      tipoLiquidacion = null; // No filtrar por tipo
    }
    
    const registros = recibosFiltrados.filter(r => {
      const coincidePeriodo = r.PeriodoLiquidacion === periodo;
      if (tipoLiquidacion) {
        return coincidePeriodo && (r.tipo_liquidacion || 'mensual') === tipoLiquidacion;
      }
      return coincidePeriodo;
    });
    
    if (registros.length === 0) return;

    try {
      // Usar la misma lógica que handleImprimirReciboEmpleado pero sin imprimir
      const legajosUnicos = [...new Set(registros.map(r => r.Legajo).filter(Boolean))];

      if (legajosUnicos.length > 1) {
        // Abrir un PDF por cada legajo
        for (const legajo of legajosUnicos) {
          const registrosLegajo = registros.filter(r => r.Legajo === legajo);
          const reciboHtml = await generarHtmlReciboEmpleado(periodo, registrosLegajo);
          const pdfWindow = window.open('', '_blank');
          pdfWindow.document.write(reciboHtml);
          pdfWindow.document.close();
          pdfWindow.onload = () => {
            pdfWindow.focus();
          };
        }
      } else {
        const reciboHtml = await generarHtmlReciboEmpleado(periodo, registros);
        const pdfWindow = window.open('', '_blank');
        pdfWindow.document.write(reciboHtml);
        pdfWindow.document.close();
        pdfWindow.onload = () => {
          pdfWindow.focus();
        };
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar el recibo del empleado: ' + error.message);
    }
  };

  // Función específica para formatear fechas de ingreso y antigüedad que vienen de la BD
  const formatearFechaBD = (fecha) => {
    if (!fecha) return '';
    
    // Si es un objeto Date, extraer componentes sin conversión de timezone
    if (fecha instanceof Date) {
      // Método alternativo: obtener los componentes directamente desde el string
      const fechaString = fecha.toString();
      
      // Intentar obtener la fecha original sin timezone
      const year = fecha.getFullYear();
      const month = fecha.getMonth() + 1; // getMonth() devuelve 0-11
      const day = fecha.getDate();
      
      // Verificar si hay diferencia con UTC (indicador de problema de timezone)
      const utcYear = fecha.getUTCFullYear();
      const utcMonth = fecha.getUTCMonth() + 1;
      const utcDay = fecha.getUTCDate();
      
      // Si hay diferencia entre local y UTC, usar UTC
      let finalDay, finalMonth, finalYear;
      if (day !== utcDay || month !== utcMonth || year !== utcYear) {
        finalDay = utcDay;
        finalMonth = utcMonth;
        finalYear = utcYear;
      } else {
        finalDay = day;
        finalMonth = month;
        finalYear = year;
      }
      
      const fechaFormateada = `${String(finalDay).padStart(2, '0')}/${String(finalMonth).padStart(2, '0')}/${finalYear}`;
      return fechaFormateada;
    }
    
    // Para strings, procesar directamente
    let fechaStr = String(fecha);
    
    // Si la fecha viene en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ o similar)
    if (fechaStr.includes('T')) {
      const [datePart, timePart] = fechaStr.split('T');
      
      // Si la hora es 03:00:00.000Z, es muy probable que sea un problema de timezone
      // La fecha original era medianoche en Argentina (GMT-3) y se convirtió mal a UTC
      if (timePart === '03:00:00.000Z') {
        const [y, m, d] = datePart.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d) + 1); // Sumar 1 día
        const fixedDay = String(dateObj.getDate()).padStart(2, '0');
        const fixedMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
        const fixedYear = dateObj.getFullYear();
        const fechaFormateada = `${fixedDay}/${fixedMonth}/${fixedYear}`;
        return fechaFormateada;
      } else {
        // Para otros casos, usar el procesamiento normal
        const [y, m, d] = datePart.split('-');
        const fechaFormateada = `${d}/${m}/${y}`;
        return fechaFormateada;
      }
    }
    
    // Si la fecha viene en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      const [y, m, d] = fechaStr.split('-');
      const fechaFormateada = `${d}/${m}/${y}`;
      return fechaFormateada;
    }
    
    // Si ya está en formato DD/MM/YYYY o similar
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fechaStr)) {
      return fechaStr;
    }
    
    return fechaStr;
  };

  // Función para convertir números a letras
  const numeroALetras = (numero) => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (numero === 0) return 'cero';
    if (numero === 100) return 'cien';
    if (numero === 1000) return 'mil';
    if (numero === 1000000) return 'un millón';

    const convertirGrupo = (n) => {
      let resultado = '';
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;

      if (c > 0) {
        if (c === 1 && d === 0 && u === 0) {
          resultado += 'cien';
        } else {
          resultado += centenas[c];
        }
      }

      if (d >= 2) {
        if (resultado) resultado += ' ';
        resultado += decenas[d];
        if (u > 0) {
          resultado += ' y ' + unidades[u];
        }
      } else if (d === 1) {
        if (resultado) resultado += ' ';
        resultado += especiales[u];
      } else if (u > 0) {
        if (resultado) resultado += ' ';
        resultado += unidades[u];
      }

      return resultado;
    };

    let resultado = '';
    const partes = [];
    
    // Millones
    if (numero >= 1000000) {
      const millones = Math.floor(numero / 1000000);
      if (millones === 1) {
        partes.push('un millón');
      } else {
        partes.push(convertirGrupo(millones) + ' millones');
      }
      numero %= 1000000;
    }

    // Miles
    if (numero >= 1000) {
      const miles = Math.floor(numero / 1000);
      if (miles === 1) {
        partes.push('mil');
      } else {
        partes.push(convertirGrupo(miles) + ' mil');
      }
      numero %= 1000;
    }

    // Unidades
    if (numero > 0) {
      partes.push(convertirGrupo(numero));
    }

    resultado = partes.join(' ');
    return resultado.charAt(0).toUpperCase() + resultado.slice(1);
  };

  // Función para convertir imagen a base64
  const imageToBase64 = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error('Error fetching image:', response.status, response.statusText);
        return null;
      }
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  // Función para generar HTML del recibo para impresión
  const generarHtmlRecibo = async (periodo, registros, empresaInfo = null) => {
    // Obtener la URL base para construir rutas completas (detección dinámica de IP)
    const baseUrl = getApiBaseUrl();
    
    const firmaUrl = registros[0]?.empresa_firma_url;
    let firmaBase64 = null;
    
    if (firmaUrl) {
      const fullFirmaUrl = firmaUrl.startsWith('http') ? firmaUrl : `${baseUrl}${firmaUrl}`;
      
      // Convertir imagen a base64 para embeberla en el HTML
      firmaBase64 = await imageToBase64(fullFirmaUrl);
    }
    
    const logoUrl = registros[0]?.empresa_logo_url;
    let logoBase64 = null;
    
    if (logoUrl) {
      const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`;
      
      // Convertir imagen a base64 para embeberla en el HTML
      logoBase64 = await imageToBase64(fullLogoUrl);
    }
    
    // --- PLANTILLA EXACTA DEL USUARIO ---
    // 1. Preparar datos y helpers
    const formatFecha = (fecha) => {
      if (!fecha) return '';
      
      // Si es un objeto Date, convertirlo usando métodos que eviten problemas de timezone
      if (fecha instanceof Date) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
      }
      
      // Si no es string, convertirlo a string
      if (typeof fecha !== 'string') {
        console.warn('formatFecha recibió un valor no string:', fecha);
        fecha = String(fecha);
      }
      
      // Si la fecha viene en formato ISO con timezone, extraer solo la parte de fecha
      if (fecha.includes('T')) {
        const [y, m, d] = fecha.split('T')[0].split('-');
        return `${d}/${m}/${y}`;
      }
      
      // Si la fecha viene en formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [y, m, d] = fecha.split('-');
        return `${d}/${m}/${y}`;
      }
      
      // Si ya está en formato DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        return fecha;
      }
      
      return fecha;
    };
    const conceptos = registros.filter(r => {
      const habCRet = parseFloat(r.ConcImpHabCRet) || 0;
      const habSRet = parseFloat(r.ConcImpHabSRet) || 0;
      const ret = parseFloat(r.ConcImpRet) || 0;
      return habCRet !== 0 || habSRet !== 0 || ret !== 0;
    }).sort((a, b) => {
      // Ordenar conceptos: primero haberes c/ret, luego haberes s/ret, luego retenciones
      const habCRetA = parseFloat(a.ConcImpHabCRet) || 0;
      const habSRetA = parseFloat(a.ConcImpHabSRet) || 0;
      const retA = parseFloat(a.ConcImpRet) || 0;
      
      const habCRetB = parseFloat(b.ConcImpHabCRet) || 0;
      const habSRetB = parseFloat(b.ConcImpHabSRet) || 0;
      const retB = parseFloat(b.ConcImpRet) || 0;
      
      // Determinar el tipo de concepto para A
      let tipoA = 3; // Por defecto, otros
      if (habCRetA > 0) tipoA = 1; // Haberes c/ret
      else if (habSRetA > 0) tipoA = 2; // Haberes s/ret
      else if (retA > 0) tipoA = 3; // Retenciones
      
      // Determinar el tipo de concepto para B
      let tipoB = 3; // Por defecto, otros
      if (habCRetB > 0) tipoB = 1; // Haberes c/ret
      else if (habSRetB > 0) tipoB = 2; // Haberes s/ret
      else if (retB > 0) tipoB = 3; // Retenciones
      
      return tipoA - tipoB;
    });
    // 2. Rellenar filas en blanco hasta 20 filas
    const MAX_FILAS = 20;
    const filasConceptos = [];
    for (let i = 0; i < MAX_FILAS; i++) {
      if (i < conceptos.length) {
        const r = conceptos[i];
        filasConceptos.push(`
          <tr><td>${r.ConcDescr || ''}</td><td class="num">${r.ConcCant || ''}</td><td class="num">${formatNumber(r.UnCant)}</td><td class="num">${formatNumber(r.ConcImpHabCRet)}</td><td class="num">${formatNumber(r.ConcImpHabSRet)}</td><td class="num">${formatNumber(r.ConcImpRet)}</td></tr>
        `.trim());
      } else {
        filasConceptos.push('<tr><td>&nbsp;</td><td class="num"></td><td class="num"></td><td class="num"></td><td class="num"></td><td class="num"></td></tr>');
      }
    }
    // 3. Totales
    const subtotalHabCRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpHabCRet) || 0), 0);
    const subtotalHabSRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpHabSRet) || 0), 0);
    const subtotalRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpRet) || 0), 0);
    const neto = subtotalHabCRet + subtotalHabSRet - subtotalRet;
    
    // Obtener el valor del sueldo/jornal desde el primer concepto con Haberes C/Ret > 0
    const primerConceptoHabCRet = conceptos.find(c => parseFloat(c.ConcImpHabCRet) > 0);
    const sueldoJornal = primerConceptoHabCRet ? parseFloat(primerConceptoHabCRet.ConcImpHabCRet) : 0;
    // 4. Render HTML exacto
    const nombreEmpresa = empresaInfo?.empresa_nombre || registros[0]?.empresa_nombre || registros[0]?.empresa_razon_social || 'Compañía Integral de Alimentos SA';
    const direccionEmpresa = empresaInfo?.empresa_direccion || registros[0]?.empresa_direccion || 'Andrés Rolón 681, San Isidro. CP 1642. Buenos Aires';
    const cuitEmpresa = empresaInfo?.empresa_cuit || registros[0]?.empresa_cuit || '33-58648427-9';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo de Haberes (Doble Talón)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{--ink:#000;--muted:#555;--grid:#dcdcdc;--ultra-tiny:6px;--extra-tiny:7.5px;--tiny:9.5px;--sm:11px;--md:12px;--lg:14px;--xl:18px;}
  html,body{margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--ink);font-size:13px}
  .page{width:180mm;min-height:270mm;margin:8mm auto 0mm auto;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:8mm 8mm 8mm 8mm;box-sizing:border-box;position:relative}
  /* .page:before eliminado para quitar la línea divisoria */
    .stub{padding:4mm 4mm 3mm;display:grid;grid-auto-rows:auto;row-gap:0}
    .head{display:flex;align-items:center;gap:15px;border:1px solid var(--ink);border-radius:15px;padding:8px 16px}
    .logo img{height:45px;width:45px;border-radius:8px;object-fit:cover}
    .company{line-height:1.3}
    .company .name{font-weight:bold;font-size:var(--lg)}
    .company .addr,.company .cuit{font-size:var(--md)}
    .row{display:grid;gap:6px}
    .row-1{grid-template-columns:95px 1fr 175px 170px}
    .row-2{grid-template-columns:120px 130px 130px 1fr 1fr}
    .field{display:grid;grid-template-rows:auto 1fr}
    .label{font-size:var(--tiny);text-transform:uppercase;color:#333;letter-spacing:.03em}
    .value{border:2px solid var(--ink);border-radius:8px;padding:5px 8px;font-size:var(--sm)}
    .value.bold{font-weight:bold}
    .value.center{text-align:center}
    .value.right{text-align:right;font-variant-numeric:tabular-nums}
    .band{display:grid;grid-template-columns:1fr 1fr}
    .band .cell{border:1px solid var(--ink);border-bottom:none;text-align:center;padding:4px 0;font-size:var(--tiny);text-transform:uppercase}
    .band-values{display:grid;grid-template-columns:1fr 1fr}
    .band-values .cell{border:1px solid var(--ink);border-top:none;padding:6px 8px;font-size:var(--sm);display:flex;justify-content:center;align-items:center}
    .band-values .cell.split{justify-content:space-between}
    .bank{opacity:.9}
    .conceptos{border:1px solid var(--ink);margin:0 !important;border-radius:0;position:relative}
    .conceptos + .conceptos{border-top:none;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;border-spacing:0;font-size:var(--tiny);margin:0 !important}
    thead th{border-bottom:1px solid var(--ink);border-right:1px solid var(--ink);padding:4px 6px;text-transform:uppercase;font-size:var(--ultra-tiny);margin:0}
    thead th:last-child{border-right:none}
    tbody td{border-right:1px solid var(--ink);border-bottom:none;padding:4px 6px;margin:0;white-space:nowrap;font-size:var(--tiny)}
    tbody td:last-child{border-right:none}
    tbody tr:last-child td{border-bottom:none}
    td.num{text-align:right;font-variant-numeric:tabular-nums}
    td.center{text-align:center}
    td.bold{font-weight:bold}
    col.desc{width:28%}
    col.cant{width:8%}
    col.valor{width:8%}
    col.habcr{width:19%}
    col.habsr{width:18%}
    col.ret{width:19%}
    .tot-right{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}
    .tot-box{border:1px solid var(--ink);min-width:160px}
    .tot-box .t-lab{border-bottom:1px solid var(--ink);padding:4px 8px;font-size:var(--tiny);text-transform:uppercase;text-align:center}
    .tot-box .t-val{padding:6px 8px;font-size:var(--sm);text-align:right;font-variant-numeric:tabular-nums}
    .totgrid{display:grid;grid-template-columns:90px 120px 1fr 150px 120px 150px;gap:0;border:1px solid var(--ink);overflow:hidden}
    .totgrid .cell{border-right:1px solid var(--ink);padding:6px 8px;font-size:var(--sm)}
    .totgrid .cell:last-child{border-right:none}
    .cell .lab{display:block;font-size:var(--tiny);text-transform:uppercase}
    .cell.center{text-align:center}
    .cell.right{text-align:right;font-variant-numeric:tabular-nums}
    .lfp{display:grid;grid-template-columns:1fr;border:1px solid var(--ink);overflow:hidden}
    .lfp .lab{border-bottom:1px solid var(--ink);text-transform:uppercase;font-size:var(--tiny);padding:4px 6px}
    .lfp .val{padding:6px 8px;font-size:var(--sm)}
    .payrow{display:grid;grid-template-columns:1fr;gap:0}
    .sonpesos{border:1px solid var(--ink);border-radius:12px;padding:10px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}
    .sonpesos-left{display:flex;flex-direction:column}
    .sonpesos .lab{font-size:var(--tiny);text-transform:uppercase;font-weight:bold}
    .sonpesos .val{font-size:var(--lg)}
    .neto{border:1px solid var(--ink);border-radius:8px;padding:0;display:flex;flex-direction:column;align-items:center;min-width:160px}
    .neto .lab{font-size:var(--tiny);text-transform:uppercase;text-align:center;border-bottom:1px solid var(--ink);padding:6px 10px 4px 10px;margin:0;width:100%;box-sizing:border-box}
    .neto .val{font-size:var(--lg);font-weight:bold;text-align:center;padding:4px 10px 6px 10px}
    .leyenda{border:1px solid var(--ink);border-radius:8px;padding:8px;font-size:var(--tiny)}
    .firmas{display:grid;grid-template-columns:1fr 1fr;gap:10mm}
    .sign{margin-top:14px;text-align:center;font-size:var(--tiny)}
    .sign:before{content:"";display:block;border-top:1px solid var(--ink);margin:18px 0 6px}
    .sign.no-line:before{display:none}
    .sign img{margin-top:0px}
    .sign:has(img):before{display:none}
    @media print{
      body{background:#fff; margin:0; padding:0;font-size:13px}
      .page{
        box-shadow:none;
        width:180mm;
        min-height:285mm;
        margin:2mm auto 0mm auto;
        padding:4mm 8mm 4mm 8mm;
        max-height:none;
        gap:0 !important;
        grid-gap:0 !important;
      }
      .stub{row-gap:0 !important; grid-row-gap:0 !important; padding:3mm 3mm 2mm; margin:0 !important}
      .head{padding:4px 8px; gap:8px; margin:0 !important}
      .conceptos{margin:0 !important; margin-bottom:0 !important}
      .conceptos + .conceptos{margin:0 !important; margin-bottom:0 !important; margin-top:0 !important}
      table{font-size:var(--ultra-tiny); margin:0 !important}
      tbody td{padding:2px 3px}
      thead th{padding:2px 3px}
      .payrow{margin-top:4px; margin-bottom:0 !important}
      .sonpesos{padding:6px}
      .leyenda{padding:4px}
      .sign{margin-top:8px}
      .sign:before{margin:8px 0 3px}
  @page{size:A4 portrait; margin:2mm 2mm 0mm 2mm}
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="stub">
      <div class="head">
        <div class="logo">
          ${logoBase64 ? 
            `<img src="${logoBase64}" alt="Logo Empresa" style="width:100px;height:45px;border-radius:8px;object-fit:cover;">` 
            : '<div style="width:100px;height:45px;border-radius:8px;"></div>'
          }
        </div>
        <div class="company">
          <div class="name">${nombreEmpresa}</div>
          <div class="addr">${direccionEmpresa}</div>
          <div class="cuit">${cuitEmpresa}</div>
        </div>
      </div>
      <div class="conceptos" style="border-top-left-radius: 8px; border-top-right-radius: 8px; overflow: hidden;">
        <table style="border-top-left-radius: 8px; border-top-right-radius: 8px; overflow: hidden;">
          <tbody>
            <tr style="border-top: 1px solid var(--ink);">
              <td style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); font-weight: bold;">Legajo</td>
              <td colspan= "2"style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); font-weight: bold;">Apellido y Nombres</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); font-weight: bold;">N° C.U.I.L.</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--tiny); font-weight: bold;">Sueldo o Jornal</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td class="center bold" style="border-right: 1px solid var(--ink);">${registros[0]?.Legajo || ''}</td>
              <td colspan="2" class="bold" style="border-right: 1px solid var(--ink); font-size: var(--tiny);">${registros[0]?.Nombre || ''}</td>
              <td class="center" style="border-right: 1px solid var(--ink);">${registros[0]?.CUIL || ''}</td>
              <td class="num">${sueldoJornal.toLocaleString('es-AR', {minimumFractionDigits:2})}</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); font-weight: bold;">Fecha Ingreso</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); font-weight: bold;">Fecha B.Antigüedad</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); font-weight: bold;">Fecha Egreso</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); font-weight: bold;">Centro Costos</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); font-weight: bold;">Tarea Desempeñada</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td class="center" style="border-right: 1px solid var(--ink);">${formatearFechaBD(registros[0]?.FecIngreso)}</td>
              <td class="center" style="border-right: 1px solid var(--ink);">${formatearFechaBD(registros[0]?.FecBaseAnt)}</td>
              <td class="center" style="border-right: 1px solid var(--ink);">${registros[0]?.FecEgreso || '-'}</td>
              <td class="center" style="border-right: 1px solid var(--ink);">${registros[0]?.CentroADesc || registros[0]?.CentroA || ''}</td>
              <td class="center">${registros[0]?.AtributoEsp1 || registros[0]?.ConcObs || 'ADMINISTRATIVO'}</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td colspan="2" style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); font-weight: bold;">Periodo Liquidado</td>
              <td colspan="3" style="text-align: center; text-transform: uppercase; font-size: var(--tiny); font-weight: bold;">Depositado en Cuenta Nro</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td colspan="2" class="center" style="border-right: 1px solid var(--ink);">${periodo}</td>
              <td colspan="3" class="center" style="font-size: var(--sm);">${registros[0]?.NroCtaBancaria || ''} ${registros[0]?.DescBco || 'BANCO HSBC'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="conceptos" style="border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; overflow: hidden;">
        <table style="border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; overflow: hidden;">
          <colgroup>
            <col class="desc"><col class="cant"><col class="valor"><col class="habcr"><col class="habsr"><col class="ret">
          </colgroup>
          <thead><tr><th>Descripción</th><th>Cant o %</th><th>Valor Uni</th><th>Haberes C/Ret.</th><th>Haberes S/Ret.</th><th>Retenciones</th></tr></thead>
          <tbody>
            ${filasConceptos.join('\n')}
            <tr >
                <td colspan="3" style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); border-top: 1px solid var(--ink);">Depósito de Aporte Jubilatorio</td>
                <td class="num right" style="border-right: 1px solid var(--ink);"></td>
                <td class="num right" style="border-right: 1px solid var(--ink);"></td>
                <td class="num right"></td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
                <td style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); width: 10%;">PERIODO</td>
                <td style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); width: 12%;">FECHA</td>
                <td style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); width: 12%;">BANCO</td>
                <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); width: 22%;">TOT.HAB.C/RET.</td>
                <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); width: 22%;">TOT.HAB.S/RET.</td>
                <td style="text-align: center; text-transform: uppercase; font-size: var(--tiny); width: 22%;">RETENCIONES</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
                <td class="center" style="border-right: 1px solid var(--ink); width: 10%;">${periodo}</td>
                <td class="center" style="border-right: 1px solid var(--ink); width: 12%;">${formatFecha(registros[0]?.FechaPago)}</td>
                <td class="center" style="border-right: 1px solid var(--ink); width: 12%;">BANCO GALICIA</td>
                <td class="num right" style="border-right: 1px solid var(--ink); width: 22%;">${formatNumber(subtotalHabCRet)}</td>
                <td class="num right" style="border-right: 1px solid var(--ink); width: 22%;">${formatNumber(subtotalHabSRet)}</td>
                <td class="num right" style="width: 22%; font-size: var(--tiny);">${formatNumber(subtotalRet)}</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
                <td colspan="6" style="text-align: left; text-transform: uppercase; font-size: var(--ultra-tiny); padding: 4px;">Lugar y fecha de pago</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
                <td colspan="6" style="text-align: left; font-size: var(--tiny); padding: 6px;">${registros[0]?.LugarPago || 'CABA'} - ${formatFecha(registros[0]?.FechaPago)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="payrow" style="margin-top: 6px;">
        <div class="sonpesos">
          <div class="sonpesos-left">
            <div class="lab">Son pesos</div>
            <div class="val">${numeroALetras(Math.floor(neto)).toUpperCase()}</div>
          </div>
          <div class="neto">
            <div class="lab">Neto a cobrar</div>
            <div class="val">${formatNumber(neto)}</div>
          </div>
        </div>
      </div>
      <div class="leyenda">LA PRESENTE LIQUIDACIÓN ES COPIA DEL RECIBO FIRMADO QUE OBRA EN PODER DE LA EMPRESA COMO COMPROBANTE DE PAGO</div>
      <div class="firmas">
        <div></div>
        <div class="sign">
          ${firmaBase64 ? 
            `<img src="${firmaBase64}" alt="Firma Empleador" style="width:120px;height:40px;margin:0px 0 5px 0;display:block;margin-left:auto;margin-right:auto;">` 
            : '<div style="border-top:1px solid var(--ink);margin:18px 0 6px 0;"></div>'
          }
          <div style="border-top:1px solid var(--ink);margin:0px 0;"></div>
          FIRMA DEL EMPLEADOR
        </div>
      </div>
    </section>
  </div>
</body>
</html>`;
  };

  // Reset import form
  const resetImportForm = () => {
    setFile(null);
    setPeriodo('');
    setAnio('');
    setFechaPago('');
    setTipoLiquidacion('mensual');
    setProgress(null);
    setPolling(false);
    setCurrentImportId(null);
    setImportError(null);
    setImportErrors([]);
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Modal handlers
  const handleOpenModal = () => {
    resetImportForm();
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
    // Don't reset form automatically when closing to preserve state during import
  };

  const handleForceCloseModal = () => {
    setOpenModal(false);
    resetImportForm();
  };
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handlePeriodoChange = (e) => setPeriodo(e.target.value);
  const handleAnioChange = (e) => setAnio(e.target.value);
  const handleFechaPagoChange = (e) => setFechaPago(e.target.value);
  const handleTipoLiquidacionChange = (e) => setTipoLiquidacion(e.target.value);

  // Importar recibos
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !periodo || !anio || !fechaPago) {
      setImportError({
        error: 'Faltan campos obligatorios',
        detalles: {
          archivo: !file ? 'Debe seleccionar un archivo' : null,
          periodo: !periodo ? 'Debe seleccionar el mes de liquidación' : null,
          anio: !anio ? 'Debe especificar el año' : null,
          fechaPago: !fechaPago ? 'Debe especificar la fecha de pago' : null
        }
      });
      return;
    }

    // Clear previous errors
    setImportError(null);
    setImportErrors([]);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('periodoLiquidacion', `${periodo}/${anio}`);
    formData.append('fechaPago', fechaPago);
    formData.append('tipoLiquidacion', tipoLiquidacion);
    setProgress({ processed: 0, total: 0, estimatedTime: null });
    setPolling(true);
    
    try {
  const response = await fetch(`${API_BASE_URL}/api/recibos/importar`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${getToken && getToken()}` }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Handle error response
        setImportError(result);
        setPolling(false);
        return;
      }
      
      if (result.importId) {
        setCurrentImportId(result.importId);
      }
    } catch (err) {
      console.error('Error al importar recibos:', err);
      setImportError({
        error: 'Error de conexión',
        detalles: {
          mensaje: 'No se pudo conectar con el servidor',
          sugerencia: 'Verifique su conexión a internet e inténtelo nuevamente'
        }
      });
      setPolling(false);
    }
  };

  // Cancelar importación
  const handleCancel = async () => {
    if (!currentImportId) {
      alert('No hay importación en curso para cancelar.');
      return;
    }
    
    const confirmCancel = window.confirm(
      `¿Estás seguro de que quieres cancelar la importación?\n\nID de importación: ${currentImportId}\n\nEsto eliminará todos los registros de esta importación específica.`
    );
    
    if (!confirmCancel) return;
    
    try {
  await fetch(`${API_BASE_URL}/api/recibos/cancelar`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${getToken && getToken()}` } 
      });
      setPolling(false);
      setProgress(null);
      setCurrentImportId(null);
      alert(`Importación ${currentImportId} cancelada y registros eliminados.`);
    } catch (err) {
      alert('Error al cancelar la importación.');
    }
  };

  // Polling de progreso
  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/recibos/progreso`);
          const data = await res.json();
          setProgress(data);
          
          // Actualizar errores si los hay
          if (data.errors && data.errors.length > 0) {
            setImportErrors(data.errors);
          }
          
          // Actualizar currentImportId si viene del servidor
          if (data.currentImportId && data.currentImportId !== currentImportId) {
            setCurrentImportId(data.currentImportId);
          }
          
          if (data.finished) {
            setPolling(false);
            // No resetear currentImportId aquí para mantener el estado final
            clearInterval(interval);
            
            // Refresh recibos list after successful import
            if (!data.hasErrors || data.errorCount < data.total) {
              const fetchRecibos = async () => {
                try {
                  const res = await fetch(`${API_BASE_URL}/api/recibos/mis-recibos`, {
                    headers: { Authorization: `Bearer ${getToken && getToken()}` }
                  });
                  const data = await res.json();
                  setRecibos(data);
                } catch (err) {
                  console.error('Error al recargar recibos:', err);
                }
              };
              fetchRecibos();
            }
          }
        } catch (err) {
          console.error('Error al obtener progreso:', err);
          setImportError({
            error: 'Error al obtener progreso de importación',
            detalles: {
              mensaje: 'No se pudo obtener el estado de la importación',
              sugerencia: 'La importación puede estar ejecutándose. Revise el historial de importaciones.'
            }
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, currentImportId]);

  // Función para renderizar recibos en formato de accordions por año (para todas las vistas)
  const renderRecibosPorAño = () => {
    const sortedData = agrupadosFiltrados
      .sort(([a], [b]) => {
        const [periodoA] = a.split('_');
        const [periodoB] = b.split('_');
        const [mesA, anioA] = periodoA.split('/').map(Number);
        const [mesB, anioB] = periodoB.split('/').map(Number);
        
        if (anioB !== anioA) return anioB - anioA;
        if (mesB !== mesA) return mesB - mesA;
        
        const [, tipoA] = a.split('_');
        const [, tipoB] = b.split('_');
        if (tipoA === 'sac' && tipoB === 'mensual') return -1;
        if (tipoA === 'mensual' && tipoB === 'sac') return 1;
        return 0;
      });

    
    // Agrupar recibos por año
    const recibosPorAnio = sortedData.reduce((grupos, [claveGrupo, registros]) => {
      const [periodo] = claveGrupo.split('_');
      const [, anio] = periodo.split('/').map(Number);
      
      if (!grupos[anio]) {
        grupos[anio] = [];
      }
      grupos[anio].push([claveGrupo, registros]);
      return grupos;
    }, {});

    // Ordenar años de más reciente a más antiguo
    const aniosOrdenados = Object.keys(recibosPorAnio)
      .map(Number)
      .sort((a, b) => b - a);


    return aniosOrdenados.map((anio, anioIndex) => {
      const recibosDelAnio = recibosPorAnio[anio];
      const totalRecibos = recibosDelAnio.length;
      const recibosFirmados = recibosDelAnio.filter(([claveGrupo]) => firma[claveGrupo]).length;

      return (
        <Accordion 
          key={anio}
          defaultExpanded={anioIndex === 0} // Expandir el año más reciente por defecto
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '&:before': {
              display: 'none',
            },
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&.Mui-expanded': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '8px 8px 0 0',
              '&.Mui-expanded': {
                borderRadius: '8px 8px 0 0',
              },
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                📅 Año {anio}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${totalRecibos} recibos`}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip 
                  label={`${recibosFirmados}/${totalRecibos} firmados`}
                  size="small"
                  color={recibosFirmados === totalRecibos ? 'success' : 'warning'}
                  sx={{ 
                    backgroundColor: recibosFirmados === totalRecibos ? 'success.light' : 'warning.light',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: isMobile ? 1 : 2 }}>
            {isMobile ? (
              // Renderizado móvil: Cards apiladas
              recibosDelAnio.map(([claveGrupo, registros], index) => {
                const [periodo, tipoLiquidacion] = claveGrupo.split('_');
                const tipoTexto = tipoLiquidacion === 'sac' ? 'SAC (Aguinaldo)' : 'Mensual';
                const puedeVer = puedeVerRecibo(claveGrupo);
                const estaFirmado = firma[claveGrupo];

                return (
                  <Card 
                    key={claveGrupo} 
                    sx={{ 
                      mb: 2, 
                      mx: 1,
                      borderRadius: 2,
                      border: puedeVer ? '1px solid #e2e8f0' : '1px solid #f44336',
                      opacity: puedeVer ? 1 : 0.7,
                      backgroundColor: puedeVer ? 'white' : '#fafafa',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        transform: 'translateY(-1px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      {/* Header del card */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {periodo}
                          </Typography>
                          <Chip 
                            label={tipoTexto} 
                            color={tipoLiquidacion === 'sac' ? 'secondary' : 'primary'} 
                            size="small" 
                            variant="filled"
                            sx={{ 
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}
                          />
                          {!puedeVer && (
                            <Chip 
                              label="🔒 Bloqueado" 
                              color="error" 
                              size="small" 
                              variant="filled"
                              sx={{ 
                                ml: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                              }}
                            />
                          )}
                        </Box>
                        <Chip 
                          label={estaFirmado ? '✅ Firmado' : '⏳ Pendiente'}
                          color={estaFirmado ? 'success' : 'warning'}
                          size="small"
                          variant="filled"
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>

                      {/* Información del empleado */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          👤 {registros[0]?.Nombre || 'N/A'}
                        </Typography>
                        {(() => {
                          const empresasUnicas = [...new Set(registros.map(r => r.empresa_nombre).filter(Boolean))];
                          const legajosUnicos = [...new Set(registros.map(r => r.Legajo).filter(Boolean))];
                          
                          if (empresasUnicas.length > 1) {
                            return (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {empresasUnicas.length} empresas
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Leg. {legajosUnicos.join(', ')}
                                </Typography>
                              </Box>
                            );
                          } else {
                            return (
                              <Box>
                                {empresasUnicas[0] && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {empresasUnicas[0]}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  Leg. {registros[0]?.Legajo || 'N/A'}
                                </Typography>
                              </Box>
                            );
                          }
                        })()}
                      </Box>
                    </CardContent>

                    {/* Acciones */}
                    <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ width: '100%', flexWrap: 'wrap', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleVerDetalle(claveGrupo)}
                          disabled={!puedeVer}
                          sx={{ 
                            minWidth: 0,
                            flex: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          Ver
                        </Button>

                        {!estaFirmado && puedeVer && tienePermiso('recibos', 'firmar') && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CreateIcon />}
                            onClick={() => handleFirmar(claveGrupo)}
                            sx={{ 
                              minWidth: 0,
                              flex: 1,
                              fontSize: '0.75rem'
                            }}
                          >
                            Firmar
                          </Button>
                        )}

                        {estaFirmado && (
                          <>
                            <Tooltip title="Ver PDF" arrow>
                              <IconButton
                                color="secondary"
                                size="medium"
                                onClick={() => handleVerPdf(claveGrupo)}
                                sx={{ 
                                  border: '1px solid',
                                  borderColor: 'secondary.main',
                                  '&:hover': {
                                    backgroundColor: 'secondary.50'
                                  }
                                }}
                              >
                                <PdfIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="PDF Empleado" arrow>
                              <IconButton
                                color="secondary"
                                size="medium"
                                onClick={() => handleVerPdfEmpleado(claveGrupo)}
                                sx={{ 
                                  border: '1px dashed',
                                  borderColor: 'secondary.main',
                                  '&:hover': {
                                    backgroundColor: 'secondary.50'
                                  }
                                }}
                              >
                                <PdfIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Imprimir Recibo" arrow>
                              <IconButton
                                color="info"
                                size="medium"
                                onClick={() => handleImprimirRecibo(claveGrupo)}
                                sx={{ 
                                  border: '1px solid',
                                  borderColor: 'info.main',
                                  '&:hover': {
                                    backgroundColor: 'info.50'
                                  }
                                }}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Imprimir Recibo Empleado" arrow>
                              <IconButton
                                color="warning"
                                size="medium"
                                onClick={() => handleImprimirReciboEmpleado(claveGrupo)}
                                sx={{ 
                                  border: '1px solid',
                                  borderColor: 'warning.main',
                                  '&:hover': {
                                    backgroundColor: 'warning.50'
                                  }
                                }}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </CardActions>
                  </Card>
                );
              })
            ) : (
              // Renderizado desktop: Tabla dentro del accordion
              <TableContainer 
                component={Paper} 
                elevation={0} 
                sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: '#e2e8f0',
                  backgroundColor: 'white',
                  mt: 1
                }}
              >
                <Table sx={{ minWidth: isTablet ? 500 : 650 }} aria-label={`tabla de recibos del año ${anio}`}>
                  <TableHead>
                    <TableRow sx={{ 
                      backgroundColor: '#f8fafc',
                      '& th': {
                        borderBottom: '2px solid #e2e8f0'
                      }
                    }}>
                      <TableCell sx={{ 
                        color: '#1976d2', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        py: 2
                      }}>
                        📅 Período de Liquidación
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#1976d2', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        py: 2
                      }}>
                        👤 Empleado
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#1976d2', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        py: 2
                      }}>
                        🏢 Empresa
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#1976d2', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        py: 2
                      }}>
                        📋 Estado
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#1976d2', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        py: 2,
                        width: '200px'
                      }}>
                        ⚡ Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recibosDelAnio.map(([claveGrupo, registros], index) => {
                      const [periodo, tipoLiquidacion] = claveGrupo.split('_');
                      const tipoTexto = tipoLiquidacion === 'sac' ? 'SAC (Aguinaldo)' : 'Mensual';
                      const puedeVer = puedeVerRecibo(claveGrupo);
                      const estaFirmado = firma[claveGrupo];

                      return (
                        <TableRow 
                          key={claveGrupo}
                          sx={{ 
                            '&:nth-of-type(odd)': { 
                              backgroundColor: '#fafbfc' 
                            },
                            '&:hover': { 
                              backgroundColor: '#f0f9ff',
                              transform: 'scale(1.005)',
                              transition: 'all 0.2s ease-in-out'
                            },
                            opacity: puedeVer ? 1 : 0.6,
                            border: puedeVer ? 'none' : '2px solid #ffebee'
                          }}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {periodo}
                              </Typography>
                              <Chip 
                                label={tipoTexto} 
                                color={tipoLiquidacion === 'sac' ? 'secondary' : 'primary'} 
                                size="small" 
                                variant="filled"
                                sx={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold'
                                }}
                              />
                              {!puedeVer && (
                                <Chip 
                                  label="🔒 Bloqueado" 
                                  color="error" 
                                  size="small" 
                                  variant="filled"
                                  sx={{ 
                                    ml: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {registros[0]?.Nombre || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Leg. {registros[0]?.Legajo || 'N/A'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            {(() => {
                              const empresasUnicas = [...new Set(registros.map(r => r.empresa_nombre).filter(Boolean))];
                              
                              if (empresasUnicas.length > 1) {
                                return (
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {empresasUnicas.length} empresas
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {empresasUnicas.slice(0, 2).join(', ')}
                                      {empresasUnicas.length > 2 && '...'}
                                    </Typography>
                                  </Box>
                                );
                              } else {
                                return (
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {empresasUnicas[0] || 'N/A'}
                                  </Typography>
                                );
                              }
                            })()}
                          </TableCell>
                          
                          <TableCell>
                            <Chip 
                              label={estaFirmado ? '✅ Firmado' : '⏳ Pendiente'}
                              color={estaFirmado ? 'success' : 'warning'}
                              variant="filled"
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleVerDetalle(claveGrupo)}
                                disabled={!puedeVer}
                                sx={{ 
                                  border: '1px solid',
                                  borderColor: puedeVer ? 'primary.main' : 'grey.400',
                                  '&:hover': {
                                    backgroundColor: 'primary.50'
                                  }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>

                              {!estaFirmado && puedeVer && tienePermiso('recibos', 'firmar') && (
                                <IconButton
                                  color="success"
                                  size="small"
                                  onClick={() => handleFirmar(claveGrupo)}
                                  sx={{ 
                                    border: '1px solid',
                                    borderColor: 'success.main',
                                    '&:hover': {
                                      backgroundColor: 'success.50'
                                    }
                                  }}
                                >
                                  <CreateIcon fontSize="small" />
                                </IconButton>
                              )}

                              {estaFirmado && (
                                <>
                                  <Tooltip title="Ver PDF" arrow>
                                    <IconButton
                                      color="secondary"
                                      size="small"
                                      onClick={() => handleVerPdf(claveGrupo)}
                                      sx={{ 
                                        border: '1px solid',
                                        borderColor: 'secondary.main',
                                        '&:hover': {
                                          backgroundColor: 'secondary.50'
                                        }
                                      }}
                                    >
                                      <PdfIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="PDF Empleado" arrow>
                                    <IconButton
                                      color="secondary"
                                      size="small"
                                      onClick={() => handleVerPdfEmpleado(claveGrupo)}
                                      sx={{ 
                                        border: '1px dashed',
                                        borderColor: 'secondary.main',
                                        '&:hover': {
                                          backgroundColor: 'secondary.50'
                                        }
                                      }}
                                    >
                                      <PdfIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Imprimir Recibo" arrow>
                                    <IconButton
                                      color="info"
                                      size="small"
                                      onClick={() => handleImprimirRecibo(claveGrupo)}
                                      sx={{ 
                                        border: '1px solid',
                                        borderColor: 'info.main',
                                        '&:hover': {
                                          backgroundColor: 'info.50'
                                        }
                                      }}
                                    >
                                      <PrintIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Imprimir Recibo Empleado" arrow>
                                    <IconButton
                                      color="warning"
                                      size="small"
                                      onClick={() => handleImprimirReciboEmpleado(claveGrupo)}
                                      sx={{ 
                                        border: '1px solid',
                                        borderColor: 'warning.main',
                                        '&:hover': {
                                          backgroundColor: 'warning.50'
                                        }
                                      }}
                                    >
                                      <PrintIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </AccordionDetails>
        </Accordion>
      );
    });
  };

  // Función para renderizar recibos en formato de cards para móvil
  const renderMobileCards = () => {
    const sortedData = agrupadosFiltrados
      .sort(([a], [b]) => {
        const [periodoA] = a.split('_');
        const [periodoB] = b.split('_');
        const [mesA, anioA] = periodoA.split('/').map(Number);
        const [mesB, anioB] = periodoB.split('/').map(Number);
        
        if (anioB !== anioA) return anioB - anioA;
        if (mesB !== mesA) return mesB - mesA;
        
        const [, tipoA] = a.split('_');
        const [, tipoB] = b.split('_');
        if (tipoA === 'sac' && tipoB === 'mensual') return -1;
        if (tipoA === 'mensual' && tipoB === 'sac') return 1;
        return 0;
      });

    
    // Agrupar recibos por año
    const recibosPorAnio = sortedData.reduce((grupos, [claveGrupo, registros]) => {
      const [periodo] = claveGrupo.split('_');
      const [, anio] = periodo.split('/').map(Number);
      
      if (!grupos[anio]) {
        grupos[anio] = [];
      }
      grupos[anio].push([claveGrupo, registros]);
      return grupos;
    }, {});

    // Ordenar años de más reciente a más antiguo
    const aniosOrdenados = Object.keys(recibosPorAnio)
      .map(Number)
      .sort((a, b) => b - a);


    return aniosOrdenados.map((anio, anioIndex) => {
      const recibosDelAnio = recibosPorAnio[anio];
      const totalRecibos = recibosDelAnio.length;
      const recibosFirmados = recibosDelAnio.filter(([claveGrupo]) => firma[claveGrupo]).length;

      return (
        <Accordion 
          key={anio}
          defaultExpanded={anioIndex === 0} // Expandir el año más reciente por defecto
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '&:before': {
              display: 'none',
            },
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&.Mui-expanded': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '8px 8px 0 0',
              '&.Mui-expanded': {
                borderRadius: '8px 8px 0 0',
              },
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                📅 Año {anio}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`${totalRecibos} recibos`}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip 
                  label={`${recibosFirmados}/${totalRecibos} firmados`}
                  size="small"
                  color={recibosFirmados === totalRecibos ? 'success' : 'warning'}
                  sx={{ 
                    backgroundColor: recibosFirmados === totalRecibos ? 'success.light' : 'warning.light',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1 }}>
            {recibosDelAnio.map(([claveGrupo, registros], index) => {
              const [periodo, tipoLiquidacion] = claveGrupo.split('_');
              const tipoTexto = tipoLiquidacion === 'sac' ? 'SAC (Aguinaldo)' : 'Mensual';
              const puedeVer = puedeVerRecibo(claveGrupo);
              const estaFirmado = firma[claveGrupo];

              return (
                <Card 
                  key={claveGrupo} 
                  sx={{ 
                    mb: 2, 
                    mx: 1,
                    borderRadius: 2,
                    border: puedeVer ? '1px solid #e2e8f0' : '1px solid #f44336',
                    opacity: puedeVer ? 1 : 0.7,
                    backgroundColor: puedeVer ? 'white' : '#fafafa',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      transform: 'translateY(-1px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    {/* Header del card */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {periodo}
                        </Typography>
                        <Chip 
                          label={tipoTexto} 
                          color={tipoLiquidacion === 'sac' ? 'secondary' : 'primary'} 
                          size="small" 
                          variant="filled"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                          }}
                        />
                        {!puedeVer && (
                          <Chip 
                            label="🔒 Bloqueado" 
                            color="error" 
                            size="small" 
                            variant="filled"
                            sx={{ 
                              ml: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}
                          />
                        )}
                      </Box>
                      <Chip 
                        label={estaFirmado ? '✅ Firmado' : '⏳ Pendiente'}
                        color={estaFirmado ? 'success' : 'warning'}
                        size="small"
                        variant="filled"
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>

                    {/* Información del empleado */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        👤 {registros[0]?.Nombre || 'N/A'}
                      </Typography>
                      {(() => {
                        const empresasUnicas = [...new Set(registros.map(r => r.empresa_nombre).filter(Boolean))];
                        const legajosUnicos = [...new Set(registros.map(r => r.Legajo).filter(Boolean))];
                        
                        if (empresasUnicas.length > 1) {
                          return (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {empresasUnicas.length} empresas
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Leg. {legajosUnicos.join(', ')}
                              </Typography>
                            </Box>
                          );
                        } else {
                          return (
                            <Box>
                              {empresasUnicas[0] && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {empresasUnicas[0]}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                Leg. {registros[0]?.Legajo || 'N/A'}
                              </Typography>
                            </Box>
                          );
                        }
                      })()}
                    </Box>
                  </CardContent>

                  {/* Acciones */}
                  <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%', flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleVerDetalle(claveGrupo)}
                        disabled={!puedeVer}
                        sx={{ 
                          minWidth: 0,
                          flex: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        Ver
                      </Button>

                      {!estaFirmado && puedeVer && tienePermiso('recibos', 'firmar') && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CreateIcon />}
                          onClick={() => handleFirmar(claveGrupo)}
                          sx={{ 
                            minWidth: 0,
                            flex: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          Firmar
                        </Button>
                      )}

                      {estaFirmado && (
                        <>
                          <Tooltip title="Ver PDF" arrow>
                            <IconButton
                              color="secondary"
                              size="medium"
                              onClick={() => handleVerPdf(claveGrupo)}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'secondary.main',
                                '&:hover': {
                                  backgroundColor: 'secondary.50'
                                }
                              }}
                            >
                              <PdfIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="PDF Empleado" arrow>
                            <IconButton
                              color="secondary"
                              size="medium"
                              onClick={() => handleVerPdfEmpleado(claveGrupo)}
                              sx={{ 
                                border: '1px dashed',
                                borderColor: 'secondary.main',
                                '&:hover': {
                                  backgroundColor: 'secondary.50'
                                }
                              }}
                            >
                              <PdfIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Imprimir Recibo" arrow>
                            <IconButton
                              color="info"
                              size="medium"
                              onClick={() => handleImprimirRecibo(claveGrupo)}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'info.main',
                                '&:hover': {
                                  backgroundColor: 'info.50'
                                }
                              }}
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Imprimir Recibo Empleado" arrow>
                            <IconButton
                              color="warning"
                              size="medium"
                              onClick={() => handleImprimirReciboEmpleado(claveGrupo)}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'warning.main',
                                '&:hover': {
                                  backgroundColor: 'warning.50'
                                }
                              }}
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </CardActions>
                </Card>
              );
            })}
          </AccordionDetails>
        </Accordion>
      );
    });
  };

  return (
    <Box sx={{ 
      p: isMobile ? 1 : 3,
      maxWidth: '100vw',
      minHeight: '100vh',
      overflow: 'visible',
      // Solo prevenir overscroll horizontal, permitir todo lo demás
      overscrollBehaviorX: 'none'
    }}>
      {/* Header Section con título moderno */}
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: '#1976d2',
          mb: 3
        }}
      >
      
      </Typography>
     

      {isAdmin && (
        <Box sx={{ 
          mb: 4,
          p: 3,
          borderRadius: 3,
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          border: '1px solid rgba(25, 118, 210, 0.1)'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              color: '#1976d2',
              fontWeight: 600
            }}
          >
            Panel de Administración
          </Typography>
          <Box sx={{ 
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
              color="primary"
              startIcon={<CloudUploadIcon />}
              onClick={handleOpenModal}
            >
              Importar Recibos
            </Button>
            <Button 
              variant="contained" 
              color="secondary"
              startIcon={<HistoryIcon />}
              onClick={() => setShowHistory(true)}
            >
              Ver Historial de Importaciones
            </Button>
            <Button 
              variant="contained"
              startIcon={<BusinessIcon />}
              onClick={() => setShowEmpresas(true)}
              sx={{
                backgroundColor: '#ff9800',
                '&:hover': {
                  backgroundColor: '#f57c00',
                }
              }}
            >
              Gestionar Empresas
            </Button>
          </Box>
        </Box>
      )}

      {/* Selector de Empresas para Usuarios con Múltiples Legajos */}
      {misLegajos.length > 1 && (
        <Box sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 3,
          backgroundColor: 'rgba(33, 150, 243, 0.05)',
          border: '1px solid rgba(33, 150, 243, 0.1)'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              color: '#2196f3',
              fontWeight: 600
            }}
          >
            Seleccionar Empresa
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: isMobile ? 1 : 2, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row',
            '& .MuiTextField-root': {
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.04)',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.2)',
                }
              }
            }
          }}>
            <TextField
              select
              label="Empresa"
              value={empresaSeleccionada}
              onChange={(e) => setEmpresaSeleccionada(e.target.value)}
              sx={{ 
                minWidth: isMobile ? '100%' : 250,
                width: isMobile ? '100%' : 'auto'
              }}
              size="small"
            >
              <MenuItem value="todas">Todas las empresas</MenuItem>
              {misLegajos.map((legajo) => (
                <MenuItem key={legajo.id} value={legajo.empresa_id}>
                  {legajo.empresa_nombre} (Legajo: {legajo.numero_legajo})
                </MenuItem>
              ))}
            </TextField>
          </Box>
          
          {empresaSeleccionada !== 'todas' && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`Mostrando recibos para: ${misLegajos.find(l => l.empresa_id.toString() === empresaSeleccionada)?.empresa_nombre}`}
                color="info"
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              />
            </Box>
          )}
        </Box>
      )}

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          bgcolor: 'background.paper', 
          p: isMobile ? 2 : 4, 
          borderRadius: 2, 
          boxShadow: 24, 
          width: isMobile ? '95vw' : 500,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <Typography variant="h6" gutterBottom>Importar Recibos</Typography>
          
          {/* Error de importación */}
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>{importError.error}</AlertTitle>
              {importError.detalles && (
                <Box sx={{ mt: 1 }}>
                  {Object.entries(importError.detalles).map(([key, value]) => 
                    value && (
                      <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                        • {value}
                      </Typography>
                    )
                  )}
                </Box>
              )}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileChange} 
              style={{ marginBottom: 16 }} 
              disabled={polling}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField 
                  select 
                  label="Mes de Liquidación" 
                  value={periodo} 
                  onChange={handlePeriodoChange} 
                  required 
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  disabled={polling}
                >
                  {months.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField 
                  label="Año" 
                  type="number" 
                  value={anio} 
                  onChange={handleAnioChange} 
                  required 
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  inputProps={{ min: 2000, max: 2100 }}
                  disabled={polling}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField 
                  label="Fecha de Pago" 
                  type="date" 
                  value={fechaPago} 
                  onChange={handleFechaPagoChange} 
                  required 
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  InputLabelProps={{ shrink: true }} 
                  disabled={polling}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField 
                  select 
                  label="Tipo de Liquidación" 
                  value={tipoLiquidacion} 
                  onChange={handleTipoLiquidacionChange} 
                  required 
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  disabled={polling}
                >
                  <MenuItem value="mensual">Mensual</MenuItem>
                  <MenuItem value="sac">SAC (Aguinaldo)</MenuItem>
                  <MenuItem value="abandono de trabajo">Abandono de Trabajo</MenuItem>
                  <MenuItem value="cesion">Cesión</MenuItem>
                  <MenuItem value="desvinculacion">Desvinculación</MenuItem>
                  <MenuItem value="fin de periodo a prueba">Fin de Periodo a Prueba</MenuItem>
                  <MenuItem value="renuncia">Renuncia</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={2} 
              sx={{ mb: 2 }}
            >
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={polling}
                fullWidth={isMobile}
              >
                {polling ? 'Importando...' : 'Importar'}
              </Button>
              
              {/* Botón de cerrar y limpiar */}
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={handleForceCloseModal}
                disabled={polling}
                fullWidth={isMobile}
              >
                Cerrar y Limpiar
              </Button>
            </Stack>
          </form>

          {/* Progreso de importación */}
          {progress && progress.total > 0 && (
            <Box sx={{ my: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={Math.round((progress.processed / progress.total) * 100)} 
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Procesados: {progress.processed} / {progress.total}
                {progress.estimatedTime !== null && ` | Tiempo estimado restante: ${Math.round(progress.estimatedTime)} seg`}
              </Typography>
              
              {/* Información de errores en progreso */}
              {progress.hasErrors && (
                <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                  ⚠️ {progress.errorCount} errores detectados durante la importación
                </Typography>
              )}
              
              {currentImportId && (
                <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                  ID de importación: {currentImportId}
                </Typography>
              )}
              
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleCancel} 
                disabled={progress.finished || !polling}
                sx={{ mb: 2 }}
              >
                Detener importación
              </Button>
              
              {/* Resultado final */}
              {progress.finished && (
                <Box>
                  {progress.hasErrors ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <AlertTitle>Importación completada con errores</AlertTitle>
                      <Typography variant="body2">
                        Se procesaron {progress.processed} registros con {progress.errorCount} errores.
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <AlertTitle>¡Importación exitosa!</AlertTitle>
                      <Typography variant="body2">
                        Se importaron {progress.processed} recibos correctamente.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Mostrar errores detallados */}
          {importErrors && importErrors.length > 0 && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography color="error" sx={{ fontWeight: 'bold' }}>
                  Errores de importación ({importErrors.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {importErrors.slice(0, 10).map((error, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={`Fila ${error.fila}: ${error.datos}`}
                        secondary={error.errores.join('; ')}
                        primaryTypographyProps={{ color: 'error', fontWeight: 'medium' }}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  ))}
                  {importErrors.length > 10 && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      ... y {importErrors.length - 10} errores más. Revise el historial para ver todos los detalles.
                    </Typography>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      </Modal>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4" sx={{ 
          mb: 3, 
          fontWeight: 'bold', 
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
           Mis Recibos de Sueldo
        </Typography>
        
        {/* Información sobre validación con diseño moderno */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: '#f8fafc',
          border: '1px solid', 
          borderColor: '#e2e8f0',
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: '#3b82f6',
            borderRadius: '2px 0 0 2px'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ 
              bgcolor: 'info.main', 
              color: 'white', 
              borderRadius: '50%', 
              p: 1,
              minWidth: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              📋
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.dark', mb: 1 }}>
                Proceso de Validación
              </Typography>
              <Typography variant="body2" color="info.dark" sx={{ lineHeight: 1.6 }}>
                Para acceder a un recibo más reciente, debe firmar todos los recibos anteriores en orden cronológico. 
                Los recibos bloqueados aparecerán marcados hasta que complete este proceso.
              </Typography>
            </Box>
          </Box>
        </Paper>
        
        {/* Contenedor principal de recibos */}
        {agrupadosFiltrados.length === 0 ? (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center', 
            bgcolor: 'grey.50',
            borderRadius: 3,
            border: '2px dashed',
            borderColor: 'grey.300',
            background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
          }}>
            <Box sx={{ 
              fontSize: '4rem', 
              mb: 2,
              opacity: 0.7,
              filter: 'grayscale(20%)'
            }}>
              📄
            </Box>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
              No hay recibos disponibles
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Los recibos aparecerán aquí una vez que sean procesados por el área de RRHH
            </Typography>
            <Box sx={{ 
              bgcolor: 'info.50', 
              p: 2, 
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'info.200',
              maxWidth: 500,
              mx: 'auto'
            }}>
              <Typography variant="body2" color="info.dark">
                💡 <strong>Consejo:</strong> Los recibos suelen estar disponibles los primeros días de cada mes
              </Typography>
            </Box>
          </Paper>
        ) : (
          // Vista unificada con accordions por año (tanto móvil como desktop)
          <Box sx={{ 
            width: '100%',
            pb: 2
          }}>
            {renderRecibosPorAño()}
          </Box>
        )}
      </Box>

      {/* Modal de Detalle de Recibo */}
      <Modal open={openDetalle} onClose={handleCloseDetalle}>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          bgcolor: 'background.paper', 
          p: isMobile ? 2 : 4, 
          borderRadius: 2, 
          boxShadow: 24, 
          width: isMobile ? '95vw' : 700,
          maxHeight: '90vh', 
          overflowY: 'auto' 
        }}>
          {detalle && detalle.registros.length > 0 && (
            <>
              {/* Encabezado empresa y empleado */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{detalle.registros[0]?.empresa_nombre || detalle.registros[0]?.empresa_razon_social || 'Compañía Integral de Alimentos SA'}</Typography>
                  <Typography variant="body2">{detalle.registros[0]?.empresa_direccion || 'Bolivar 187 3º C - Capital Federal'}</Typography>
                  <Typography variant="body2">{detalle.registros[0]?.empresa_cuit || '33-58648427-9'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>LEG. {detalle.registros[0].Legajo}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{detalle.registros[0].Nombre}</Typography>
                  <Typography variant="body2">CUIL: {detalle.registros[0].CUIL}</Typography>
                  <Typography variant="body2">Sueldo: {formatNumber(detalle.registros[0].ConcImpHabCRet || detalle.registros[0].ConcImpHabSRet || detalle.registros[0].ConcImpRet)}</Typography>
                </Box>
              </Box>
              {/* Fechas y centro de costos */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="body2">Fecha Ingreso: {formatearFechaBD(detalle.registros[0].FecIngreso)}</Typography>
                  <Typography variant="body2">Fecha B.Antiguedad: {formatearFechaBD(detalle.registros[0].FecBaseAnt)}</Typography>
                  <Typography variant="body2">Fecha Egreso: {detalle.registros[0].FecEgreso}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2">Centro de Costos: {detalle.registros[0].CentroADesc || detalle.registros[0].CentroA}</Typography>
                  <Typography variant="body2">Tarea: {detalle.registros[0].AtributoEsp1 || detalle.registros[0].ConcObs}</Typography>
                </Box>
              </Box>
              {/* Periodo y banco */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Typography variant="body2">Período Liquidado: {detalle.periodo}</Typography>
                <Typography variant="body2">Depositado en cuenta: {detalle.registros[0].NroCtaBancaria} {detalle.registros[0].DescBco}</Typography>
              </Box>
              {/* Tabla de conceptos */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Detalle de conceptos</Typography>
              <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: '0.95em' }}>
                <thead>
                  <tr style={{ background: '#eee' }}>
                    <th style={{ textAlign: 'left' }}>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Cant o %</th>
                    <th style={{ textAlign: 'right' }}>Valor Uni</th>
                    <th style={{ textAlign: 'right' }}>Haberes C/Ret</th>
                    <th style={{ textAlign: 'right' }}>Haberes S/Ret</th>
                    <th style={{ textAlign: 'right' }}>Retenciones</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.registros
                    .filter(r => {
                      // Mostrar solo si alguno de los importes es distinto de cero
                      const habCRet = parseFloat(r.ConcImpHabCRet) || 0;
                      const habSRet = parseFloat(r.ConcImpHabSRet) || 0;
                      const ret = parseFloat(r.ConcImpRet) || 0;
                      return habCRet !== 0 || habSRet !== 0 || ret !== 0;
                    })
                    .sort((a, b) => {
                      // Ordenar conceptos: primero haberes c/ret, luego haberes s/ret, luego retenciones
                      const habCRetA = parseFloat(a.ConcImpHabCRet) || 0;
                      const habSRetA = parseFloat(a.ConcImpHabSRet) || 0;
                      const retA = parseFloat(a.ConcImpRet) || 0;
                      
                      const habCRetB = parseFloat(b.ConcImpHabCRet) || 0;
                      const habSRetB = parseFloat(b.ConcImpHabSRet) || 0;
                      const retB = parseFloat(b.ConcImpRet) || 0;
                      
                      // Determinar el tipo de concepto para A
                      let tipoA = 3; // Por defecto, otros
                      if (habCRetA > 0) tipoA = 1; // Haberes c/ret
                      else if (habSRetA > 0) tipoA = 2; // Haberes s/ret
                      else if (retA > 0) tipoA = 3; // Retenciones
                      
                      // Determinar el tipo de concepto para B
                      let tipoB = 3; // Por defecto, otros
                      if (habCRetB > 0) tipoB = 1; // Haberes c/ret
                      else if (habSRetB > 0) tipoB = 2; // Haberes s/ret
                      else if (retB > 0) tipoB = 3; // Retenciones
                      
                      return tipoA - tipoB;
                    })
                    .map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'left' }}>{r.ConcDescr}</td>
                        <td style={{ textAlign: 'right' }}>{r.ConcCant}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(r.UnCant)}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(r.ConcImpHabCRet)}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(r.ConcImpHabSRet)}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(r.ConcImpRet)}</td>
                      </tr>
                    ))}
                  {/* Subtotales por columna */}
                  {(() => {
                    const conceptos = detalle.registros.filter(r => {
                      const habCRet = parseFloat(r.ConcImpHabCRet) || 0;
                      const habSRet = parseFloat(r.ConcImpHabSRet) || 0;
                      const ret = parseFloat(r.ConcImpRet) || 0;
                      return habCRet !== 0 || habSRet !== 0 || ret !== 0;
                    });
                    const subtotalHabCRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpHabCRet) || 0), 0);
                    const subtotalHabSRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpHabSRet) || 0), 0);
                    const subtotalRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpRet) || 0), 0);
                    return (
                      <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                        <td colSpan={3} style={{ textAlign: 'right' }}></td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(subtotalHabCRet)}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(subtotalHabSRet)}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(subtotalRet)}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
              {/* Pie de recibo */}
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body2">Lugar y fecha de pago: {detalle.registros[0].LugarPago} - {formatFechaSegura(detalle.registros[0].FechaPago)}</Typography>
                {(() => {
                  const conceptos = detalle.registros.filter(r => {
                    const habCRet = parseFloat(r.ConcImpHabCRet) || 0;
                    const habSRet = parseFloat(r.ConcImpHabSRet) || 0;
                    const ret = parseFloat(r.ConcImpRet) || 0;
                    return habCRet !== 0 || habSRet !== 0 || ret !== 0;
                  });
                  const subtotalHabCRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpHabCRet) || 0), 0);
                  const subtotalHabSRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpHabSRet) || 0), 0);
                  const subtotalRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpRet) || 0), 0);
                  const neto = subtotalHabCRet + subtotalHabSRet - subtotalRet;
                  return (
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                      Neto a cobrar: <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{formatNumber(neto)}</span>
                    </Typography>
                  );
                })()}
                <Typography variant="body2" sx={{ mt: 1 }}>Recibo en conformidad del importe de la presente liquidación en pago de mi remuneración correspondiente al período arriba indicado y copia de este recibo.</Typography>
              </Box>
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button variant="contained" onClick={handleCloseDetalle}>Cerrar</Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Modal para firmar recibo */}
      <Modal open={firmaModal.open} onClose={() => setFirmaModal({ open: false, periodo: null })}>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          bgcolor: 'background.paper', 
          p: isMobile ? 2 : 4, 
          borderRadius: 2, 
          boxShadow: 24, 
          width: isMobile ? '90vw' : 350 
        }}>
          <Typography variant="h6" gutterBottom>Firmar Recibo</Typography>
          <Typography variant="body2" gutterBottom>
            Para firmar el recibo del período <b>
              {(() => {
                if (firmaModal.periodo && firmaModal.periodo.includes('_')) {
                  const [periodo, tipo] = firmaModal.periodo.split('_');
                  const tipoTexto = tipo === 'sac' ? 'SAC (Aguinaldo)' : 'Mensual';
                  return `${periodo} (${tipoTexto})`;
                }
                return firmaModal.periodo;
              })()}
            </b> ingresa tu contraseña:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
            “Declaro haber recibido y aceptado el presente recibo de haberes. La aceptación mediante usuario y contraseña constituye mi firma electrónica conforme Ley 25.506.”
          </Typography>
          <TextField
            label="Contraseña"
            type="password"
            value={firmaPassword}
            onChange={e => setFirmaPassword(e.target.value)}
            fullWidth
            margin="normal"
            autoFocus
            error={!!firmaError}
            helperText={firmaError}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setFirmaModal({ open: false, periodo: null })}>Cancelar</Button>
            <Button variant="contained" color="success" onClick={handleFirmaSubmit}>Firmar</Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal de Historial de Importaciones */}
      <HistorialImportaciones 
        open={showHistory} 
        onClose={() => setShowHistory(false)} 
      />

      {/* Modal de Gestión de Empresas */}
      <Modal open={showEmpresas} onClose={() => setShowEmpresas(false)}>
        <Box sx={{ 
          position: 'absolute', 
          top: '5%', 
          left: '5%', 
          right: '5%', 
          bottom: '5%', 
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          boxShadow: 24, 
          overflow: 'auto'
        }}>
          <GestionEmpresas />
        </Box>
      </Modal>
    </Box>
  );
};

export default Recibos;
