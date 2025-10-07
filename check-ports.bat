@echo off
echo 🔍 Verificando qué procesos usan los puertos 80 y 443...
echo.

echo ▶️ Puerto 80:
netstat -ano | findstr ":80 "
echo.

echo ▶️ Puerto 443:
netstat -ano | findstr ":443 "
echo.

echo ▶️ Servicios comunes que podrían estar usando estos puertos:
echo    - IIS (Internet Information Services)
echo    - Apache
echo    - Nginx
echo    - Skype (puerto 80)
echo    - Otro contenedor Docker
echo.

echo 🛠️ Soluciones:
echo.
echo 1. DETENER IIS (si está ejecutándose):
echo    net stop w3svc
echo    net stop iisadmin
echo.
echo 2. DETENER otros servicios web:
echo    sc stop apache2.4
echo    sc stop nginx
echo.
echo 3. DETENER contenedores Docker existentes:
echo    docker ps
echo    docker stop [CONTAINER_ID]
echo.
echo 4. USAR PUERTOS ALTERNATIVOS:
echo    docker-compose -f docker-compose.alt-ports.yml up -d
echo.

pause