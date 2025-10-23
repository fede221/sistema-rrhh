const helmet = require('helmet');

/**
 * Configuración de Helmet para Headers de Seguridad HTTP
 * Implementa OWASP Security Headers Best Practices
 *
 * Headers configurados:
 * - Content-Security-Policy (CSP)
 * - X-DNS-Prefetch-Control
 * - X-Frame-Options
 * - Strict-Transport-Security (HSTS)
 * - X-Download-Options
 * - X-Content-Type-Options
 * - X-Permitted-Cross-Domain-Policies
 * - Referrer-Policy
 * - X-XSS-Protection (legacy)
 */

const helmetConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return helmet({
    // Content Security Policy - Previene XSS, inyección de código
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        // Scripts: solo desde el mismo origen
        // 'unsafe-inline' necesario para React en desarrollo
        // 'unsafe-eval' puede ser necesario para algunas librerías
        scriptSrc: isProduction
          ? ["'self'"]
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],

        // Estilos: permitir inline styles para Material-UI
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

        // Fuentes: Google Fonts y mismo origen
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],

        // Imágenes: mismo origen, data URIs, y HTTPS
        imgSrc: ["'self'", "data:", "https:", "blob:"],

        // Conexiones: API en mismo origen
        connectSrc: ["'self'"],

        // Frames: no permitir ser embebido (anti-clickjacking)
        frameSrc: ["'none'"],

        // Objetos (Flash, etc): no permitir
        objectSrc: ["'none'"],

        // Media (audio/video): mismo origen
        mediaSrc: ["'self'"],

        // Manifests (PWA): mismo origen
        manifestSrc: ["'self'"],

        // Workers: mismo origen
        workerSrc: ["'self'", "blob:"],

        // Form actions: solo mismo origen
        formAction: ["'self'"],

        // Base URI: restringir <base> tag
        baseUri: ["'self'"],

        // Upgrade insecure requests en producción
        ...(isProduction ? { upgradeInsecureRequests: [] } : {})
      },
      // Reportar violaciones (opcional, para monitoreo)
      reportOnly: false
    },

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Puede causar problemas con recursos externos

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },

  // Cross-Origin-Resource-Policy
  // En desarrollo permitimos 'cross-origin' para que el frontend (otro puerto/origen) pueda cargar
  // imágenes y recursos estáticos desde /uploads. En producción mantenemos 'same-origin' para mayor seguridad.
  crossOriginResourcePolicy: { policy: isProduction ? 'same-origin' : 'cross-origin' },

    // DNS Prefetch Control - Previene fugas de información
    dnsPrefetchControl: { allow: false },

    // Expect-CT - Transparencia de certificados (deprecated pero no hace daño)
    expectCt: {
      maxAge: 86400, // 24 horas
      enforce: isProduction
    },

    // X-Frame-Options - Previene clickjacking
    frameguard: {
      action: 'deny' // No permitir ser embebido en iframes
    },

    // Hide Powered-By - No revelar tecnología usada
    hidePoweredBy: true,

    // HSTS - Forzar HTTPS (solo en producción)
    hsts: isProduction ? {
      maxAge: 31536000, // 1 año en segundos
      includeSubDomains: true, // Aplicar a subdominios
      preload: true // Incluir en lista de precarga de navegadores
    } : false, // Deshabilitado en desarrollo (usa HTTP)

    // IE No Open - IE8+ no abre downloads en contexto del sitio
    ieNoOpen: true,

    // No Sniff - Previene MIME type sniffing
    noSniff: true,

    // Origin Agent Cluster
    originAgentCluster: true,

    // Permitted Cross-Domain Policies (Adobe)
    permittedCrossDomainPolicies: {
      permittedPolicies: "none"
    },

    // Referrer Policy - Controla información enviada en header Referer
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    },

    // X-XSS-Protection - Legacy, pero no hace daño
    xssFilter: true
  });
};

module.exports = helmetConfig;
