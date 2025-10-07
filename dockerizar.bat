@echo off
echo ===============================================
echo  DOCKERIZANDO APLICACION RRHH - GUIA RAPIDA
echo ===============================================
echo.

echo 1. Verificando Docker...
docker --version
if %errorlevel% neq 0 (
    echo ERROR: Docker no encontrado. Instala Docker Desktop primero.
    pause
    exit /b 1
)

echo.
echo 2. Verificando Docker Compose...
docker-compose --version
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose no encontrado.
    pause
    exit /b 1
)

echo.
echo 3. Limpiando contenedores previos...
docker-compose down 2>nul

echo.
echo 4. Construyendo imágenes...
echo (Esto puede tomar varios minutos la primera vez)
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo ERROR: Falló la construcción de imágenes.
    echo Revisa los errores arriba.
    pause
    exit /b 1
)

echo.
echo 5. Iniciando servicios...
docker-compose up -d

if %errorlevel% neq 0 (
    echo ERROR: Falló el inicio de servicios.
    echo Revisa los errores arriba.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo  DOCKERIZACIÓN COMPLETADA!
echo ===============================================
echo.
echo Frontend disponible en: http://localhost:3000
echo Backend API disponible en: http://localhost:3001
echo Health Check: http://localhost:3001/api/health
echo.
echo Para ver logs: docker-compose logs -f
echo Para parar: docker-compose down
echo.
pause