// Utilidades compartidas para generación de recibos
import { getApiBaseUrl } from '../config';

// Función para formatear números con punto de miles y coma decimal (formato argentino)
export const formatNumber = (num) => {
  if (!num || isNaN(num)) return '';
  const number = parseFloat(num);
  if (number === 0) return '';
  return number.toLocaleString('es-AR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// Función para formatear fechas desde la base de datos
export const formatearFechaBD = (fecha) => {
  if (!fecha) return '';
  
  // Si es un objeto Date, extraer componentes sin conversión de timezone
  if (fecha instanceof Date) {
    const year = fecha.getFullYear();
    const month = fecha.getMonth() + 1;
    const day = fecha.getDate();
    
    const utcYear = fecha.getUTCFullYear();
    const utcMonth = fecha.getUTCMonth() + 1;
    const utcDay = fecha.getUTCDate();
    
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
    
    const dd = String(finalDay).padStart(2, '0');
    const mm = String(finalMonth).padStart(2, '0');
    return `${dd}/${mm}/${finalYear}`;
  }
  
  if (typeof fecha !== 'string') {
    console.warn('formatearFechaBD recibió un valor no string:', fecha);
    fecha = String(fecha);
  }
  
  if (fecha.includes('T')) {
    const [y, m, d] = fecha.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
    return fecha;
  }
  
  return fecha;
};

// Función para convertir imagen a base64
export const imageToBase64 = async (imageUrl) => {
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

// Función principal para generar HTML del recibo
export const generarHtmlRecibo = async (periodo, registros, empresaInfo = null) => {
  const baseUrl = getApiBaseUrl();
  
  const firmaUrl = registros[0]?.empresa_firma_url;
  let firmaBase64 = null;
  
  if (firmaUrl) {
    const fullFirmaUrl = firmaUrl.startsWith('http') ? firmaUrl : `${baseUrl}${firmaUrl}`;
    firmaBase64 = await imageToBase64(fullFirmaUrl);
  }
  
  const logoUrl = registros[0]?.empresa_logo_url;
  let logoBase64 = null;
  
  if (logoUrl) {
    const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${baseUrl}${logoUrl}`;
    logoBase64 = await imageToBase64(fullLogoUrl);
  }
  
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    
    if (fecha instanceof Date) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    
    if (typeof fecha !== 'string') {
      console.warn('formatFecha recibió un valor no string:', fecha);
      fecha = String(fecha);
    }
    
    if (fecha.includes('T')) {
      const [y, m, d] = fecha.split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, m, d] = fecha.split('-');
      return `${d}/${m}/${y}`;
    }
    
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
    const habCRetA = parseFloat(a.ConcImpHabCRet) || 0;
    const habSRetA = parseFloat(a.ConcImpHabSRet) || 0;
    const retA = parseFloat(a.ConcImpRet) || 0;
    
    const habCRetB = parseFloat(b.ConcImpHabCRet) || 0;
    const habSRetB = parseFloat(b.ConcImpHabSRet) || 0;
    const retB = parseFloat(b.ConcImpRet) || 0;
    
    let tipoA = 3;
    if (habCRetA > 0) tipoA = 1;
    else if (habSRetA > 0) tipoA = 2;
    else if (retA > 0) tipoA = 3;
    
    let tipoB = 3;
    if (habCRetB > 0) tipoB = 1;
    else if (habSRetB > 0) tipoB = 2;
    else if (retB > 0) tipoB = 3;
    
    return tipoA - tipoB;
  });

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

  const subtotalHabCRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpHabCRet) || 0), 0);
  const subtotalHabSRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpHabSRet) || 0), 0);
  const subtotalRet = conceptos.reduce((acc, r) => acc + (parseFloat(r.ConcImpRet) || 0), 0);
  const neto = subtotalHabCRet + subtotalHabSRet - subtotalRet;
  
  const primerConceptoHabCRet = conceptos.find(c => parseFloat(c.ConcImpHabCRet) > 0);
  const sueldoJornal = primerConceptoHabCRet ? parseFloat(primerConceptoHabCRet.ConcImpHabCRet) : 0;

  const nombreEmpresa = empresaInfo?.empresa_nombre || registros[0]?.empresa_nombre || registros[0]?.empresa_razon_social || 'Compañía Integral de Alimentos SA';
  const direccionEmpresa = empresaInfo?.empresa_direccion || registros[0]?.empresa_direccion || 'Andrés Rolón 681, San Isidro. CP 1642. Buenos Aires';
  const cuitEmpresa = empresaInfo?.empresa_cuit || registros[0]?.empresa_cuit || '33-58648427-9';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo de Haberes</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{--ink:#000;--muted:#555;--grid:#dcdcdc;--ultra-tiny:6px;--extra-tiny:7.5px;--tiny:9.5px;--sm:11px;--md:12px;--lg:14px;--xl:18px;}
  html,body{margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--ink);font-size:13px}
  .page{width:180mm;min-height:270mm;margin:8mm auto 0mm auto;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:8mm 8mm 8mm 8mm;box-sizing:border-box;position:relative}
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
              <td colspan="2" style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); font-weight: bold;">Apellido y Nombres</td>
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
            <tr>
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
                <td class="center" style="border-right: 1px solid var(--ink);">${periodo}</td>
                <td class="center" style="border-right: 1px solid var(--ink);">${formatFecha(registros[0]?.FechaPago)}</td>
                <td class="center" style="border-right: 1px solid var(--ink);">${registros[0]?.DescBco || ''}</td>
                <td class="num" style="border-right: 1px solid var(--ink);">${formatNumber(subtotalHabCRet)}</td>
                <td class="num" style="border-right: 1px solid var(--ink);">${formatNumber(subtotalHabSRet)}</td>
                <td class="num">${formatNumber(subtotalRet)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="payrow">
        <div class="sonpesos">
          <div class="sonpesos-left">
            <div class="lab">Neto a cobrar en pesos</div>
            <div class="val">$${formatNumber(neto)}</div>
          </div>
          <div class="neto">
            <div class="lab">Neto</div>
            <div class="val">$${formatNumber(neto)}</div>
          </div>
        </div>
      </div>
      <div class="leyenda">RECIBÍ DE CONFORMIDAD EL IMPORTE DE LA PRESENTE LIQUIDACIÓN EN PAGO DE MI REMUNERACIÓN CORRESPONDIENTE AL PERÍODO ARRIBA INDICADO Y COPIA DE ESTE RECIBO</div>
      <div class="firmas">
        ${firmaBase64 ? `<div class="sign no-line"><img src="${firmaBase64}" alt="Firma Empresa" style="height:60px;margin-bottom:8px;"></div>` : '<div class="sign"></div>'}
        <div class="sign">FIRMA DEL EMPLEADO</div>
      </div>
    </section>
  </div>
</body>
</html>`;
};
