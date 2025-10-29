# 🔄 Script de Actualización de Versión
# Ejecutar antes de cada deploy/release

param(
    [Parameter(Mandatory=$true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$NewVersion,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('major', 'minor', 'patch')]
    [string]$BumpType
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Actualizando versión del Sistema RRHH" -ForegroundColor Cyan
Write-Host ""

# Si se proporciona BumpType, calcular la nueva versión automáticamente
if ($BumpType) {
    $currentVersion = Get-Content "VERSION" -Raw
    $parts = $currentVersion.Trim() -split '\.'
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]
    
    switch ($BumpType) {
        'major' { 
            $major++
            $minor = 0
            $patch = 0
        }
        'minor' { 
            $minor++
            $patch = 0
        }
        'patch' { 
            $patch++
        }
    }
    
    $NewVersion = "$major.$minor.$patch"
    Write-Host "📊 Versión actual: $currentVersion" -ForegroundColor Yellow
    Write-Host "📈 Nueva versión ($BumpType): $NewVersion" -ForegroundColor Green
}

$BuildDate = Get-Date -Format "yyyy-MM-dd"

# 1. Actualizar archivo VERSION
Write-Host "📝 Actualizando VERSION..." -ForegroundColor Yellow
Set-Content -Path "VERSION" -Value $NewVersion -NoNewline

# 2. Actualizar version.json
Write-Host "📝 Actualizando version.json..." -ForegroundColor Yellow
$versionJson = @{
    version = $NewVersion
    buildDate = $BuildDate
    buildNumber = (Get-Date).ToString("yyyyMMddHHmmss")
    releaseNotes = "Versión $NewVersion"
    environment = "production"
} | ConvertTo-Json -Depth 10

Set-Content -Path "version.json" -Value $versionJson

# 3. Actualizar package.json del frontend
Write-Host "📝 Actualizando frontend/package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "frontend/package.json" -Raw | ConvertFrom-Json
$packageJson.version = $NewVersion
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "frontend/package.json"

# 4. Actualizar package.json del backend
Write-Host "📝 Actualizando backend/package.json..." -ForegroundColor Yellow
$backendPackageJson = Get-Content "backend/package.json" -Raw | ConvertFrom-Json
$backendPackageJson.version = $NewVersion
$backendPackageJson | ConvertTo-Json -Depth 10 | Set-Content "backend/package.json"

# 5. Actualizar .env.production
Write-Host "📝 Actualizando .env.production..." -ForegroundColor Yellow
$envContent = @"
# Variables de entorno para producción
REACT_APP_VERSION=$NewVersion
REACT_APP_BUILD_DATE=$BuildDate
REACT_APP_ENV=production
"@
Set-Content -Path "frontend/.env.production" -Value $envContent

# 6. Actualizar .env.development
Write-Host "📝 Actualizando .env.development..." -ForegroundColor Yellow
$envDevContent = @"
# Variables de entorno para desarrollo
REACT_APP_VERSION=$NewVersion
REACT_APP_BUILD_DATE=$BuildDate
REACT_APP_ENV=development
"@
Set-Content -Path "frontend/.env.development" -Value $envDevContent

Write-Host ""
Write-Host "✅ Versión actualizada exitosamente a: $NewVersion" -ForegroundColor Green
Write-Host "📅 Fecha de build: $BuildDate" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Actualiza el CHANGELOG.md con los cambios de esta versión" -ForegroundColor White
Write-Host "2. Commit los cambios: git add . && git commit -m 'chore: bump version to $NewVersion'" -ForegroundColor White
Write-Host "3. Crea un tag: git tag -a v$NewVersion -m 'Release v$NewVersion'" -ForegroundColor White
Write-Host "4. Push: git push && git push --tags" -ForegroundColor White
Write-Host "5. Build y deploy: ./build-and-push.ps1" -ForegroundColor White
Write-Host ""

# Mostrar resumen de archivos actualizados
Write-Host "📦 Archivos actualizados:" -ForegroundColor Magenta
Write-Host "  - VERSION" -ForegroundColor Gray
Write-Host "  - version.json" -ForegroundColor Gray
Write-Host "  - frontend/package.json" -ForegroundColor Gray
Write-Host "  - backend/package.json" -ForegroundColor Gray
Write-Host "  - frontend/.env.production" -ForegroundColor Gray
Write-Host "  - frontend/.env.development" -ForegroundColor Gray
Write-Host ""
