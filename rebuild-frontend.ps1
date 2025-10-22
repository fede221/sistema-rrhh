# Script para reconstruir SOLO el frontend
Write-Host "=== Reconstruyendo Frontend ===" -ForegroundColor Cyan

$DOCKER_USER = "elcheloide"
$VERSION = "latest"
$FRONTEND_IMAGE = "${DOCKER_USER}/sistema-rrhh-frontend:${VERSION}"

Write-Host "1. Construyendo imagen del Frontend..." -ForegroundColor Yellow
Set-Location frontend
docker build -t $FRONTEND_IMAGE .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló la construcción del frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "`n2. Subiendo imagen del Frontend a Docker Hub..." -ForegroundColor Yellow
docker push $FRONTEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló el push del frontend" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== ¡Frontend actualizado exitosamente! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora en el servidor ejecuta:" -ForegroundColor Yellow
Write-Host "  docker compose pull frontend" -ForegroundColor White
Write-Host "  docker compose up -d frontend" -ForegroundColor White
