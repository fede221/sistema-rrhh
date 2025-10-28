# Script to diagnose and fix UTF-8 encoding issues
# Usage: .\fix-encoding.ps1

Write-Host "🔍 Running UTF-8 Encoding Diagnostic..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeCheck = node --version 2>$null
if (-not $nodeCheck) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Node.js version: $nodeCheck" -ForegroundColor Green
Write-Host ""

# Run the diagnostic script
$scriptPath = Join-Path $PSScriptRoot "fix-encoding.js"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

# Set environment variables for database connection
$env:DB_HOST = $env:DB_HOST -or "localhost"
$env:DB_USER = $env:DB_USER -or "root"
$env:DB_PASSWORD = $env:DB_PASSWORD -or ""
$env:DB_NAME = $env:DB_NAME -or "rrhh_db"

Write-Host "Starting diagnostic tool..." -ForegroundColor Yellow
node $scriptPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Script exited with error code: $LASTEXITCODE" -ForegroundColor Red
} else {
    Write-Host "✓ Script completed successfully" -ForegroundColor Green
}
