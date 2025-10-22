# Backend Dockerfile
FROM node:18-alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el código de la aplicación
COPY . .

# Crear backup de uploads iniciales
RUN if [ -d uploads ] && [ "$(ls -A uploads)" ]; then \
        cp -r uploads uploads-initial; \
        echo "Backup de uploads creado con $(ls uploads | wc -l) archivos"; \
    fi

# Copiar script de inicialización
COPY init-uploads.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-uploads.sh

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto (se sobrescriben con docker-compose)
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/health || exit 1

# Comando para iniciar la aplicación (con script de inicialización)
CMD ["/usr/local/bin/init-uploads.sh"]
