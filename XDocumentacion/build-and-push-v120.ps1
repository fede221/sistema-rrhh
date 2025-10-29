# Script para construir y subir las imagenes de Docker con tag v120
# Ejecutar desde la raiz del proyecto

Write-Host "=== Sistema RRHH - Build y Push v120 ===" -ForegroundColor Cyan
Write-Host ""

# Variables
$DOCKER_USER = "elcheloide"
$VERSION = "v120"
$BACKEND_IMAGE = "${DOCKER_USER}/sistema-rrhh-backend:${VERSION}"
$FRONTEND_IMAGE = "${DOCKER_USER}/sistema-rrhh-frontend:${VERSION}"

Write-Host "Version: $VERSION" -ForegroundColor Cyan
Write-Host "Backend Image: $BACKEND_IMAGE" -ForegroundColor White
Write-Host "Frontend Image: $FRONTEND_IMAGE" -ForegroundColor White
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: Este script debe ejecutarse desde la raiz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "1 Verificando login en Docker..." -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: No se pudo hacer login en Docker Hub" -ForegroundColor Red
    exit 1
}

Write-Host "`n2 Limpiando imagenes anteriores..." -ForegroundColor Yellow
docker rmi $BACKEND_IMAGE -f 2>$null
docker rmi $FRONTEND_IMAGE -f 2>$null
Write-Host "Limpieza completada" -ForegroundColor Green

Write-Host "`n3 Construyendo imagen del Backend..." -ForegroundColor Yellow
Push-Location backend
docker build -t $BACKEND_IMAGE .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Fallo la construccion del backend" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "Backend construido exitosamente" -ForegroundColor Green
Pop-Location

Write-Host "`n4 Construyendo imagen del Frontend..." -ForegroundColor Yellow
Push-Location frontend
docker build -t $FRONTEND_IMAGE .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Fallo la construccion del frontend" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "Frontend construido exitosamente" -ForegroundColor Green
Pop-Location

Write-Host "`n5 Subiendo Backend a Docker Hub..." -ForegroundColor Yellow
docker push $BACKEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Fallo el push del backend" -ForegroundColor Red
    exit 1
}
Write-Host "Backend subido exitosamente" -ForegroundColor Green

Write-Host "`n6 Subiendo Frontend a Docker Hub..." -ForegroundColor Yellow
docker push $FRONTEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Fallo el push del frontend" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend subido exitosamente" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Build y Push completados!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Imagenes publicadas en Docker Hub:" -ForegroundColor Cyan
Write-Host $BACKEND_IMAGE -ForegroundColor White
Write-Host $FRONTEND_IMAGE -ForegroundColor White
Write-Host ""
