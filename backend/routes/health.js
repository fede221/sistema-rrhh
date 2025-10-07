// Health check route
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const os = require('os');

// Health check endpoint
router.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
    memory: process.memoryUsage(),
    pid: process.pid,
    version: process.version,
    platform: process.platform,
    arch: process.arch,
    system: {
      cpus: os.cpus().length,
      freemem: os.freemem(),
      totalmem: os.totalmem(),
      loadavg: os.loadavg(),
      uptime: os.uptime()
    },
    env: {
      node_env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001
    }
  };

  // Verificar conexión a la base de datos
  db.query('SELECT 1 as health_check, NOW() as server_time', (err, results) => {
    if (err) {
      healthCheck.status = 'ERROR';
      healthCheck.database = {
        status: 'DISCONNECTED',
        error: err.message,
        code: err.code
      };
      return res.status(500).json(healthCheck);
    }
    
    healthCheck.database = {
      status: 'CONNECTED',
      response_time: new Date() - new Date(results[0].server_time),
      server_time: results[0].server_time
    };
    
    // Obtener estadísticas adicionales de la BD
    db.query('SHOW STATUS LIKE "Threads_connected"', (err, threads) => {
      if (!err && threads.length > 0) {
        healthCheck.database.connections = parseInt(threads[0].Value);
      }
      
      res.status(200).json(healthCheck);
    });
  });
});

// Endpoint para métricas más detalladas
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform
    },
    system: {
      arch: os.arch(),
      platform: os.platform(),
      cpus: os.cpus(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      networkInterfaces: Object.keys(os.networkInterfaces())
    }
  };
  
  res.json(metrics);
});

// Endpoint para forzar garbage collection (solo en desarrollo)
router.post('/gc', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    if (global.gc) {
      const beforeGC = process.memoryUsage();
      global.gc();
      const afterGC = process.memoryUsage();
      
      res.json({ 
        message: 'Garbage collection ejecutado',
        before: beforeGC,
        after: afterGC,
        freed: {
          rss: beforeGC.rss - afterGC.rss,
          heapUsed: beforeGC.heapUsed - afterGC.heapUsed,
          heapTotal: beforeGC.heapTotal - afterGC.heapTotal
        }
      });
    } else {
      res.status(400).json({ error: 'Garbage collection no disponible. Ejecutar con --expose-gc' });
    }
  } else {
    res.status(403).json({ error: 'No disponible en producción' });
  }
});

// Endpoint para reinicio controlado (solo superadmin)
router.post('/restart', (req, res) => {
  // Este endpoint podría ser usado por PM2 o supervisord
  if (process.env.NODE_ENV !== 'production') {
    res.json({ message: 'Reinicio programado en 3 segundos' });
    setTimeout(() => {
      process.exit(0);
    }, 3000);
  } else {
    res.status(403).json({ error: 'No disponible en producción' });
  }
});

module.exports = router;