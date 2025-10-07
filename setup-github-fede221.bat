@echo off
echo ===============================================
echo  SETUP GITHUB PARA USUARIO: fede221
echo ===============================================
echo.

echo Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Git no esta instalado.
    echo.
    echo 📥 DESCARGANDO GIT...
    echo Ve a: https://git-scm.com/download/win
    echo.
    echo 1. Descarga "64-bit Git for Windows Setup"
    echo 2. Ejecuta el instalador
    echo 3. Acepta todas las opciones por defecto
    echo 4. Reinicia esta terminal y ejecuta este script de nuevo
    echo.
    pause
    exit /b 1
)

echo ✅ Git encontrado!
echo.

echo 🔧 Configurando Git con tu usuario...
git config --global user.name "fede221"
git config --global user.email "fede221@gmail.com"

echo.
echo 📁 Inicializando repositorio...
git init

echo.
echo 📝 Agregando archivos...
git add .

echo.
echo 💾 Creando commit inicial...
git commit -m "Initial commit: Sistema RRHH completo con Docker y validaciones mejoradas"

echo.
echo 🌿 Configurando rama principal...
git branch -M main

echo.
echo ===============================================
echo  🚀 SIGUIENTE PASO: CREAR REPOSITORIO EN GITHUB
echo ===============================================
echo.
echo 1. Ve a: https://github.com/new
echo 2. Repository name: sistema-rrhh
echo 3. Description: Sistema de gestión de RRHH con React y Node.js
echo 4. Selecciona: Private (IMPORTANTE!)
echo 5. NO inicializar con README (ya tenemos uno)
echo 6. Click "Create repository"
echo.
echo 7. Copia y ejecuta estos comandos en esta terminal:
echo.
echo git remote add origin https://github.com/fede221/sistema-rrhh.git
echo git push -u origin main
echo.
echo (Te va a pedir usuario: fede221 y tu personal access token)
echo.
echo ===============================================
echo  🔑 NOTA SOBRE AUTENTICACIÓN
echo ===============================================
echo.
echo GitHub ya no acepta contraseñas. Necesitas un Personal Access Token:
echo.
echo 1. Ve a: https://github.com/settings/tokens
echo 2. Click "Generate new token (classic)"
echo 3. Nombre: "Sistema RRHH"
echo 4. Selecciona: repo (todos los permisos de repositorio)
echo 5. Click "Generate token"
echo 6. COPIA el token (no lo vas a ver de nuevo)
echo 7. Usa este token como contraseña cuando Git te lo pida
echo.
pause