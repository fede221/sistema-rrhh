module.exports = {
  apps: [{
    name: 'rrhh-backend',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    // Reiniciar automáticamente si hay problemas
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configuración de logs
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    
    // Health check y monitoreo
    kill_timeout: 3000,
    listen_timeout: 3000,
    
    // Configuración de memoria
    node_args: '--max-old-space-size=4096'
  }]
};