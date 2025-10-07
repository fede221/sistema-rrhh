// Plantilla HTML para recibo de haberes (doble talón)
// Usar variables entre llaves dobles {{variable}} para reemplazo dinámico
// Logo y firma deben ser URLs o base64

module.exports = function reciboTemplate(data) {
  // data: { empresa, empleado, periodo, cuenta, conceptos, totales, neto, son_pesos, fecha_pago, banco, ... }
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo de Haberes (Doble Talón)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{
      --ink:#000;
      --muted:#555;
      --grid:#dcdcdc;
      --ultra-tiny:6px;
      --extra-tiny:7.5px;
      --tiny:9.5px;
      --sm:11px;
      --md:12px;
      --lg:14px;
      --xl:18px;
    }
    html,body{margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--ink)}
    .page{width:297mm;min-height:200mm;margin:auto;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:4mm;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;gap:2mm;position:relative}
    .page:before{content:"";position:absolute;left:calc(50% - .5mm);top:0;bottom:0;width:0;border-left:1.5px dashed #9a9a9a}
    .stub{padding:4mm 4mm 3mm;display:grid;grid-auto-rows:auto;row-gap:0}
    .head{display:flex;align-items:center;gap:15px;border:1px solid var(--ink);border-radius:15px;padding:8px 16px}
    .logo img{height:45px;width:45px;border-radius:8px;object-fit:cover}
    .company{line-height:1.3}
    .company .name{font-weight:bold;font-size:var(--lg)}
    .company .addr,.company .cuit{font-size:var(--md)}
    /* ...resto del CSS igual al HTML de plantilla... */
    /* (por brevedad, aquí deberías pegar el CSS completo de la plantilla recibo - Royal - copia.html) */
  </style>
</head>
<body>
  <div class="page">
    <section class="stub">
      <div class="head">
        <div class="logo">
          ${data.empresa.logoUrl ? `<img src="${data.empresa.logoUrl}" alt="Logo" />` : `<div style="width:100px;height:45px;border-radius:8px;"></div>`}
        </div>
        <div class="company">
          <div class="name">${data.empresa.nombre || ''}</div>
          <div class="addr">${data.empresa.direccion || ''}</div>
          <div class="cuit">${data.empresa.cuit || ''}</div>
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
              <td class="center bold" style="border-right: 1px solid var(--ink);">${data.empleado.legajo || ''}</td>
              <td colspan="2" class="bold" style="border-right: 1px solid var(--ink); font-size: var(--sm);">${data.empleado.nombre || ''}</td>
              <td class="center" style="border-right: 1px solid var(--ink);">${data.empleado.cuil || ''}</td>
              <td class="num">${data.empleado.sueldo || ''}</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); font-weight: bold;">Fecha Ingreso</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); font-weight: bold;">Fecha B.Antigüedad</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); font-weight: bold;">Fecha Egreso</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); border-right: 1px solid var(--ink); font-weight: bold;">Centro Costos</td>
              <td style="text-align: center; text-transform: uppercase; font-size: var(--extra-tiny); font-weight: bold;">Tarea Desempeñada</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td class="center" style="border-right: 1px solid var(--ink);">${data.empleado.ingreso || ''}</td>
              <td class="center" style="border-right: 1px solid var(--ink);">${data.empleado.antiguedad || ''}</td>
              <td class="center" style="border-right: 1px solid var(--ink);">${data.empleado.egreso || '-'}</td>
              <td class="center" style="border-right: 1px solid var(--ink);">${data.empleado.centro_costos || ''}</td>
              <td class="center">${data.empleado.tarea || ''}</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td colspan="2" style="text-align: center; text-transform: uppercase; font-size: var(--tiny); border-right: 1px solid var(--ink); font-weight: bold;">Periodo Liquidado</td>
              <td colspan="3" style="text-align: center; text-transform: uppercase; font-size: var(--tiny); font-weight: bold;">Depositado en Cuenta Nro</td>
            </tr>
            <tr style="border-top: 1px solid var(--ink);">
              <td colspan="2" class="center" style="border-right: 1px solid var(--ink);">${data.periodo || ''}</td>
              <td colspan="3" class="center" style="font-size: var(--sm);">${data.cuenta || ''}</td>
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
            ${(data.conceptos || []).map(c => `
              <tr>
                <td>${c.descripcion || ''}</td>
                <td class="num">${c.cantidad || ''}</td>
                <td class="num">${c.valor_unitario || ''}</td>
                <td class="num">${c.haberes_con_ret || ''}</td>
                <td class="num">${c.haberes_sin_ret || ''}</td>
                <td class="num">${c.retenciones || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="payrow" style="margin-top: 6px;">
        <div class="sonpesos">
          <div class="sonpesos-left">
            <div class="lab">Son pesos</div>
            <div class="val">${data.son_pesos || ''}</div>
          </div>
          <div class="neto">
            <div class="lab">Neto a cobrar</div>
            <div class="val">${data.neto || ''}</div>
          </div>
        </div>
      </div>
      <div class="leyenda">${data.leyenda || 'LA PRESENTE LIQUIDACIÓN ES COPIA DEL RECIBO FIRMADO QUE OBRA EN PODER DE LA EMPRESA COMO COMPROBANTE DE PAGO'}</div>
      <div class="firmas">
        <div></div>
        <div class="sign">
          ${data.empresa.firmaUrl ? `<img src="${data.empresa.firmaUrl}" alt="Firma Empleador" style="width:120px;height:40px;margin:0px 0 5px 0;display:block;margin-left:auto;margin-right:auto;">` : ''}
          <div style="border-top:1px solid var(--ink);margin:0px 0;"></div>
          FIRMA DEL EMPLEADOR
        </div>
      </div>
    </section>
  </div>
</body>
</html>`;
};
