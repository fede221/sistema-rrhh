@echo off
echo ===============================================
echo  CONFIGURANDO GIT Y SUBIENDO A GITHUB
echo  Usuario: fede221
echo ===============================================
echo.

set GIT="C:\Program Files\Git\bin\git.exe"

echo ✅ Git encontrado: 
%GIT% --version
echo.

echo 🔧 Configurando Git con tu usuario...
%GIT% config --global user.name "fede221"
%GIT% config --global user.email "fede221@users.noreply.github.com"

echo.
echo 📁 Inicializando repositorio...
%GIT% init

echo.
echo 📝 Agregando archivos...
%GIT% add .

echo.
echo 💾 Creando commit inicial...
%GIT% commit -m "Initial commit: Sistema RRHH completo con Docker y validaciones mejoradas"

echo.
echo 🌿 Configurando rama principal...
%GIT% branch -M main

echo.
echo ===============================================
echo  ✅ REPOSITORIO LOCAL LISTO!
echo ===============================================
echo.
echo 🚀 SIGUIENTE PASO: CREAR REPOSITORIO EN GITHUB
echo.
echo 1. Ve a: https://github.com/new
echo 2. Repository name: sistema-rrhh
echo 3. Description: Sistema de gestion de RRHH con React y Node.js
echo 4. Selecciona: ✅ Private (IMPORTANTE!)
echo 5. NO inicializar con README (ya tenemos uno)
echo 6. Click "Create repository"
echo.
echo 7. Luego ejecuta estos comandos:
echo.
echo %GIT% remote add origin https://github.com/fede221/sistema-rrhh.git
echo %GIT% push -u origin main
echo.
echo ===============================================
echo  🔑 CREDENCIALES PARA EL PUSH:
echo ===============================================
echo.
echo Usuario: fede221
echo Password: [Personal Access Token - ver instrucciones abajo]
echo.
echo 📝 CREAR PERSONAL ACCESS TOKEN:
echo 1. Ve a: https://github.com/settings/tokens
echo 2. Click "Generate new token (classic)"
echo 3. Name: "Sistema RRHH"
echo 4. Expiration: 90 days
echo 5. Scopes: Selecciona "repo" (acceso completo a repositorios)
echo 6. Click "Generate token"
echo 7. COPIA el token y usalo como contraseña
echo.
echo ===============================================
pause

echo.
echo ¿Queres que ejecute los comandos de conexion ahora? (s/n)
set /p respuesta=
if /i "%respuesta%"=="s" (
    echo.
    echo 🔗 Conectando con GitHub...
    %GIT% remote add origin https://github.com/fede221/sistema-rrhh.git
    echo.
    echo 📤 Subiendo codigo...
    %GIT% push -u origin main
    echo.
    echo ✅ ¡PROYECTO SUBIDO A GITHUB!
    echo URL: https://github.com/fede221/sistema-rrhh
) else (
    echo.
    echo 📋 Comandos para ejecutar manualmente:
    echo %GIT% remote add origin https://github.com/fede221/sistema-rrhh.git
    echo %GIT% push -u origin main
)

echo.
pause