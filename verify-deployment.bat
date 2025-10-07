@echo off
REM Script para verificar el despliegue
echo 🔍 Verificando despliegue de RRHH...
echo.

echo ▶️ Verificando containers...
docker-compose -f docker-compose.production.yml ps
echo.

echo ▶️ Verificando logs del frontend (Caddy)...
timeout 5 docker-compose -f docker-compose.production.yml logs frontend
echo.

echo ▶️ Verificando logs del backend...
timeout 5 docker-compose -f docker-compose.production.yml logs backend
echo.

echo ▶️ Verificando health check del backend...
curl -f http://localhost:3001/api/health
echo.

echo ▶️ Verificando respuesta del frontend...
curl -I http://localhost
echo.

echo ▶️ Verificando dominio (si DNS está configurado)...
curl -I http://rrhh.dbconsulting.com.ar
echo.

echo ✅ Verificación completada
echo.
echo 🌐 URLs para probar:
echo    http://localhost
echo    http://rrhh.dbconsulting.com.ar
echo    https://rrhh.dbconsulting.com.ar ^(después de que Caddy configure SSL^)