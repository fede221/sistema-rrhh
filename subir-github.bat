@echo off
echo ===============================================
echo  SUBIENDO PROYECTO RRHH A GITHUB
echo ===============================================
echo.

echo Verificando si Git esta instalado...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git no esta instalado.
    echo Descarga Git desde: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Git encontrado. Continuando...
echo.

echo 1. Inicializando repositorio Git...
git init

echo.
echo 2. Agregando archivos al repositorio...
git add .

echo.
echo 3. Creando commit inicial...
git commit -m "Initial commit: Sistema RRHH completo con Docker"

echo.
echo 4. Configurando rama principal...
git branch -M main

echo.
echo ===============================================
echo  PASOS MANUALES REQUERIDOS:
echo ===============================================
echo.
echo 1. Ve a GitHub.com y crea un nuevo repositorio
echo    - Nombre sugerido: sistema-rrhh
echo    - Descripcion: Sistema de gestion de RRHH con React y Node.js
echo    - Mantenerlo PRIVADO (contiene configuraciones sensibles)
echo.
echo 2. Copia la URL del repositorio (ejemplo):
echo    https://github.com/tu-usuario/sistema-rrhh.git
echo.
echo 3. Ejecuta estos comandos con tu URL:
echo    git remote add origin https://github.com/tu-usuario/sistema-rrhh.git
echo    git push -u origin main
echo.
echo ===============================================
echo  COMANDOS PREPARADOS PARA COPIAR:
echo ===============================================
echo.
echo # Reemplaza TU_USUARIO con tu usuario de GitHub
echo git remote add origin https://github.com/TU_USUARIO/sistema-rrhh.git
echo git push -u origin main
echo.
echo ===============================================
pause