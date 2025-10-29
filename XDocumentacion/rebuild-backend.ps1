# Script para rebuild y push del backend con las correcciones
# Ejecutar desde el directorio raíz del proyecto

Write-Host "🚀 Iniciando rebuild del backend con correcciones de healthcheck..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend/Dockerfile")) {
    Write-Host "❌ Error: No se encuentra backend/Dockerfile" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde el directorio raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# Verificar que Docker está corriendo
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Error: Docker no está corriendo o no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Construyendo imagen del backend..." -ForegroundColor Cyan
Set-Location backend

# Build de la imagen
docker build -t elcheloide/sistema-rrhh-backend:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Imagen construida exitosamente" -ForegroundColor Green

# Preguntar si hacer push a Docker Hub
$push = Read-Host "¿Hacer push a Docker Hub? (s/n)"

if ($push -eq "s" -or $push -eq "S") {
    Write-Host "🚢 Haciendo push a Docker Hub..." -ForegroundColor Cyan
    docker push elcheloide/sistema-rrhh-backend:latest
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al hacer push a Docker Hub" -ForegroundColor Red
        Write-Host "   ¿Iniciaste sesión con 'docker login'?" -ForegroundColor Yellow
        Set-Location ..
        exit 1
    }
    
    Write-Host "✅ Push completado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos en el servidor:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.caddy.yml pull backend" -ForegroundColor White
    Write-Host "   docker-compose -f docker-compose.caddy.yml up -d backend" -ForegroundColor White
} else {
    Write-Host "⏭️  Push omitido. Puedes hacerlo manualmente con:" -ForegroundColor Yellow
    Write-Host "   docker push elcheloide/sistema-rrhh-backend:latest" -ForegroundColor White
}

Set-Location ..

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host "📄 Lee FIX_UNHEALTHY_CONTAINER.md para más información" -ForegroundColor Cyan
