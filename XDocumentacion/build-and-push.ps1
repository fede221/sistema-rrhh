# Script para construir y subir las imágenes de Docker
# Ejecutar desde la raíz del proyecto

Write-Host "=== Sistema RRHH - Build y Push de Imágenes Docker ===" -ForegroundColor Cyan
Write-Host ""

# Variables
$DOCKER_USER = "elcheloide"
$VERSION = "latest"
$BACKEND_IMAGE = "${DOCKER_USER}/sistema-rrhh-backend:${VERSION}"
$FRONTEND_IMAGE = "${DOCKER_USER}/sistema-rrhh-frontend:${VERSION}"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: Este script debe ejecutarse desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "1. Verificando login en Docker Hub..." -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: No se pudo hacer login en Docker Hub" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Verificando archivos de uploads..." -ForegroundColor Yellow
$uploadsCount = (Get-ChildItem -Path "backend/uploads/*.png" -ErrorAction SilentlyContinue).Count
if ($uploadsCount -eq 0) {
    Write-Host "⚠️  Advertencia: No se encontraron archivos PNG en backend/uploads/" -ForegroundColor Yellow
} else {
    Write-Host "✓ Encontrados $uploadsCount archivos en backend/uploads/" -ForegroundColor Green
}

Write-Host "`n3. Construyendo imagen del Backend..." -ForegroundColor Yellow
Set-Location backend
docker build -t $BACKEND_IMAGE .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló la construcción del backend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "`n4. Construyendo imagen del Frontend..." -ForegroundColor Yellow
Set-Location frontend
docker build -t $FRONTEND_IMAGE .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló la construcción del frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "`n5. Subiendo imagen del Backend a Docker Hub..." -ForegroundColor Yellow
docker push $BACKEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló el push del backend" -ForegroundColor Red
    exit 1
}

Write-Host "`n6. Subiendo imagen del Frontend a Docker Hub..." -ForegroundColor Yellow
docker push $FRONTEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló el push del frontend" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== ¡Build y Push completados exitosamente! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Imágenes creadas y subidas:" -ForegroundColor Cyan
Write-Host "  - $BACKEND_IMAGE" -ForegroundColor White
Write-Host "  - $FRONTEND_IMAGE" -ForegroundColor White
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Copiar docker-compose.prod.yml al servidor" -ForegroundColor White
Write-Host "  2. Crear archivo .env con las variables de entorno" -ForegroundColor White
Write-Host "  3. Ejecutar: docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor White
Write-Host "  4. Configurar DNS apuntando rrhh.dbconsulting.com.ar a la IP del servidor" -ForegroundColor White
