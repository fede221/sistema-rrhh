@echo off
REM Script para construir y ejecutar en producción (Windows)
echo 🚀 Construyendo aplicación RRHH para producción...

REM Parar containers existentes
docker-compose down

REM Construir imágenes
docker-compose build --no-cache

REM Ejecutar en producción
docker-compose up -d

echo ✅ Aplicación ejecutándose en:
echo    Frontend: http://localhost
echo    Backend: http://localhost:3001
echo.
echo Para ver logs: docker-compose logs -f
echo Para parar: docker-compose down