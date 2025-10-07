@echo off
REM Script para despliegue en producción con Caddy
echo 🚀 Desplegando RRHH en rrhh.dbconsulting.com.ar con Caddy...

echo ℹ️  Caddy gestionará automáticamente los certificados SSL
echo    No necesitas configurar certificados SSL manualmente
echo    Caddy los obtendrá automáticamente de Let's Encrypt
echo.

REM Parar containers existentes
docker-compose -f docker-compose.production.yml down

REM Construir imágenes
docker-compose -f docker-compose.production.yml build --no-cache

REM Ejecutar en producción
docker-compose -f docker-compose.production.yml up -d

echo ✅ Aplicación desplegada en:
echo    Dominio: https://rrhh.dbconsulting.com.ar
echo    HTTP: http://rrhh.dbconsulting.com.ar ^(Caddy redirige automáticamente a HTTPS^)
echo    Backend API: https://rrhh.dbconsulting.com.ar/api
echo.
echo 🔒 Caddy está configurando automáticamente SSL...
echo    Los certificados se obtendrán de Let's Encrypt
echo.
echo Para ver logs: docker-compose -f docker-compose.production.yml logs -f
echo Para parar: docker-compose -f docker-compose.production.yml down