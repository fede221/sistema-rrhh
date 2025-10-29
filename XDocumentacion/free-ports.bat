@echo off
echo 🚀 Liberando puertos 80 y 443 para RRHH...
echo.

echo ▶️ Deteniendo IIS si está ejecutándose...
net stop w3svc 2>nul
net stop iisadmin 2>nul
echo.

echo ▶️ Deteniendo Apache si está ejecutándose...
sc stop apache2.4 2>nul
echo.

echo ▶️ Deteniendo Nginx si está ejecutándose...
sc stop nginx 2>nul
echo.

echo ▶️ Verificando contenedores Docker en puertos 80/443...
for /f "tokens=1" %%i in ('docker ps --format "table {{.ID}}" ^| findstr /v "CONTAINER"') do (
    docker port %%i | findstr ":80\|:443" >nul
    if !errorlevel! equ 0 (
        echo Deteniendo contenedor %%i que usa puerto 80/443...
        docker stop %%i
    )
)
echo.

echo ▶️ Verificando puertos nuevamente...
netstat -ano | findstr ":80 " && (
    echo ⚠️ Puerto 80 sigue ocupado
) || (
    echo ✅ Puerto 80 libre
)

netstat -ano | findstr ":443 " && (
    echo ⚠️ Puerto 443 sigue ocupado
) || (
    echo ✅ Puerto 443 libre
)
echo.

echo 🎯 Si los puertos siguen ocupados, usar:
echo    docker-compose -f docker-compose.alt-ports.yml up -d
echo.
pause