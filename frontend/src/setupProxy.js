const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para todas las rutas /api
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'silent', // Silencia logs del proxy
      onError: (err, req, res) => {
        // Silenciar errores de proxy para /sw.js
        if (req.path !== '/sw.js') {
          console.error('Proxy error:', err);
        }
      }
    })
  );

  // Silenciar completamente /sw.js (Service Worker)
  app.use('/sw.js', (req, res) => {
    res.status(404).send('Service Worker not available');
  });
};
