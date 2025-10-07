@echo off
REM Script para despliegue con puertos alternativos
echo 🚀 Desplegando RRHH en puertos alternativos...
echo    HTTP: 8080
echo    HTTPS: 8443
echo.

REM Parar containers existentes
docker-compose -f docker-compose.alt-ports.yml down

REM Construir imágenes con configuración de puertos alternativos
echo ▶️ Construyendo imagen del frontend con puertos alternativos...
docker build -t rrhh-frontend-alt --build-arg CADDYFILE=Caddyfile.alt-ports ./frontend

echo ▶️ Construyendo imagen del backend...
docker-compose -f docker-compose.alt-ports.yml build backend

REM Ejecutar en producción
docker-compose -f docker-compose.alt-ports.yml up -d

echo ✅ Aplicación desplegada en puertos alternativos:
echo    HTTP: http://rrhh.dbconsulting.com.ar:8080
echo    HTTPS: https://rrhh.dbconsulting.com.ar:8443
echo    Backend API: https://rrhh.dbconsulting.com.ar:8443/api
echo.
echo 🔒 Caddy está configurando automáticamente SSL en puerto 8443...
echo.
echo Para ver logs: docker-compose -f docker-compose.alt-ports.yml logs -f
echo Para parar: docker-compose -f docker-compose.alt-ports.yml down