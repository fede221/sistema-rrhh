# Multi-stage build
# Stage 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto de los archivos
COPY . .

# Build de la aplicación para producción con dominio
ENV REACT_APP_API_URL=https://rrhh.dbconsulting.com.ar
RUN npm run build

# Stage 2: Serve the app with Caddy
FROM caddy:2-alpine

# Copiar los archivos build de la stage anterior
COPY --from=build /app/build /usr/share/caddy

# Copiar configuración de Caddy
COPY Caddyfile /etc/caddy/Caddyfile

# Crear directorio para logs
RUN mkdir -p /var/log/caddy

# Exponer puertos 80 y 443
EXPOSE 80 443

# Caddy se ejecuta automáticamente con la configuración
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]