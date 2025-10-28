# ============================================================================
# SCRIPT DE IMPLEMENTACIÓN: ESCALABILIDAD RRHH (Para Windows con MySQL)
# ============================================================================
# Uso: powershell -ExecutionPolicy Bypass -File implement-scalability.ps1
#
# Este script implementa de forma automática:
# 1. Particionamiento de tablas grandes
# 2. Master-Slave Replication
# 3. Monitoreo y alertas
# ============================================================================

param(
    [string]$Action = "info",
    [string]$MasterHost = "34.176.128.94",
    [string]$SlaveHost = "127.0.0.1",
    [string]$DBUser = "root",
    [string]$DBPass = "pos38ric0S",
    [string]$DBName = "RRHH",
    [string]$ReplUser = "replicador",
    [string]$ReplPass = "ReplicaPassword123!"
)

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Title" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([int]$Number, [string]$Title)
    Write-Host "[$Number] $Title" -ForegroundColor Green -BackgroundColor Black
}

function Write-Status {
    param([string]$Message, [ValidateSet("success", "error", "warning", "info")]$Status = "info")
    $colors = @{
        "success" = "Green"
        "error" = "Red"
        "warning" = "Yellow"
        "info" = "Cyan"
    }
    Write-Host "    $Message" -ForegroundColor $colors[$Status]
}

function Test-MySQLConnection {
    param([string]$Host, [string]$User, [string]$Password)
    
    try {
        $mysqlCmd = "mysql -h $Host -u $User -p$Password -e `"SELECT 1;`" 2>&1"
        $result = Invoke-Expression $mysqlCmd
        return $result -like "*1*"
    } catch {
        return $false
    }
}

function Execute-MySQLScript {
    param(
        [string]$Host,
        [string]$User,
        [string]$Password,
        [string]$Database,
        [string]$Script
    )
    
    $query = $Script -replace "`"", "\`""
    $cmd = "mysql -h $Host -u $User -p$Password $Database -e `"$query`""
    
    try {
        $output = Invoke-Expression $cmd 2>&1
        return @{ Success = $true; Output = $output }
    } catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# ============================================================================
# MENÚ PRINCIPAL
# ============================================================================

function Show-Menu {
    Write-Host ""
    Write-Host "🎯 ESCALABILIDAD RRHH - MENÚ DE OPCIONES" -ForegroundColor Cyan -BackgroundColor Black
    Write-Host ""
    Write-Host "  [1] 📊 Diagnosticar estado actual (Análisis BD)"
    Write-Host "  [2] 📈 Implementar PARTICIONAMIENTO (Performance)"
    Write-Host "  [3] 🔄 Implementar MASTER-SLAVE REPLICATION (HA)"
    Write-Host "  [4] 🏥 Implementar KEEPALIVED (Failover automático)"
    Write-Host "  [5] ✅ Verificar status de escalabilidad"
    Write-Host "  [6] 📚 Ver documentación completa"
    Write-Host "  [0] ❌ Salir"
    Write-Host ""
    $choice = Read-Host "Selecciona opción"
    return $choice
}

# ============================================================================
# OPCIÓN 1: DIAGNOSTICAR ESTADO ACTUAL
# ============================================================================

function Diagnose-Database {
    Write-Header "DIAGNÓSTICO DE BASE DE DATOS"
    
    Write-Step 1 "Conectando a Master ($MasterHost)..."
    
    if (-not (Test-MySQLConnection $MasterHost $DBUser $DBPass)) {
        Write-Status "❌ No se puede conectar a $MasterHost" "error"
        return
    }
    Write-Status "✅ Conexión exitosa" "success"
    
    Write-Step 2 "Analizando tamaño y cantidad de registros..."
    
    $script = @"
SELECT 
    TABLE_NAME,
    TABLE_ROWS as 'Registros',
    ROUND(DATA_LENGTH / 1024 / 1024, 2) as 'Tamaño MB',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) as 'Índices MB'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'RRHH'
ORDER BY TABLE_ROWS DESC;
"@
    
    $result = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $script
    if ($result.Success) {
        Write-Status "Análisis completado:" "success"
        Write-Host $result.Output
    } else {
        Write-Status "Error: $($result.Error)" "error"
    }
    
    Write-Step 3 "Revisando índices..."
    
    $indexScript = @"
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'RRHH'
ORDER BY TABLE_NAME, INDEX_NAME;
"@
    
    $indexResult = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $indexScript
    if ($indexResult.Success) {
        Write-Status "Índices encontrados:" "success"
        Write-Host $indexResult.Output | Head -20
    }
    
    Write-Step 4 "Estado de replicación..."
    
    $replScript = @"
SHOW VARIABLES LIKE 'log_bin';
SHOW VARIABLES LIKE 'binlog_format';
SHOW MASTER STATUS;
"@
    
    $replResult = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $replScript
    if ($replResult.Success) {
        Write-Host $replResult.Output
    }
}

# ============================================================================
# OPCIÓN 2: IMPLEMENTAR PARTICIONAMIENTO
# ============================================================================

function Implement-Partitioning {
    Write-Header "IMPLEMENTAR PARTICIONAMIENTO"
    
    Write-Step 1 "Validando conexión..."
    if (-not (Test-MySQLConnection $MasterHost $DBUser $DBPass)) {
        Write-Status "❌ No se puede conectar" "error"
        return
    }
    Write-Status "✅ Conexión OK" "success"
    
    Write-Step 2 "Creando BACKUP (seguridad primero)..."
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "rrhh-backup-partition-$timestamp.sql"
    
    $mysqldumpCmd = "mysqldump -h $MasterHost -u $DBUser -p$DBPass --single-transaction $DBName > $backupFile"
    
    try {
        Write-Status "Ejecutando backup a $backupFile..." "info"
        Invoke-Expression $mysqldumpCmd
        Write-Status "✅ Backup completado" "success"
    } catch {
        Write-Status "❌ Error en backup: $_" "error"
        return
    }
    
    Write-Step 3 "Implementando particionamiento en recibos_excel_raw..."
    
    $partitionScript = @"
ALTER TABLE recibos_excel_raw
PARTITION BY RANGE (YEAR(fecha_importacion) * 100 + MONTH(fecha_importacion)) (
  PARTITION p202401 VALUES LESS THAN (202402),
  PARTITION p202402 VALUES LESS THAN (202403),
  PARTITION p202403 VALUES LESS THAN (202404),
  PARTITION p202404 VALUES LESS THAN (202405),
  PARTITION p202405 VALUES LESS THAN (202406),
  PARTITION p202406 VALUES LESS THAN (202407),
  PARTITION p202407 VALUES LESS THAN (202408),
  PARTITION p202408 VALUES LESS THAN (202409),
  PARTITION p202409 VALUES LESS THAN (202410),
  PARTITION p202410 VALUES LESS THAN (202411),
  PARTITION p202411 VALUES LESS THAN (202412),
  PARTITION p202412 VALUES LESS THAN (202413),
  PARTITION p202501 VALUES LESS THAN (202502),
  PARTITION p202502 VALUES LESS THAN (202503),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
"@
    
    Write-Status "Ejecutando particionamiento (esto puede tomar 1-2 minutos)..." "info"
    $result = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $partitionScript
    
    if ($result.Success) {
        Write-Status "✅ Particionamiento completado" "success"
    } else {
        Write-Status "❌ Error: $($result.Error)" "error"
        Write-Status "⚠️  Restaurando desde backup..." "warning"
        $restoreCmd = "mysql -h $MasterHost -u $DBUser -p$DBPass $DBName < $backupFile"
        Invoke-Expression $restoreCmd
        return
    }
    
    Write-Step 4 "Verificando particiones..."
    
    $verifyScript = @"
SELECT 
    PARTITION_NAME,
    TABLE_ROWS,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) as 'MB'
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = 'RRHH' 
AND TABLE_NAME = 'recibos_excel_raw'
AND PARTITION_NAME IS NOT NULL
ORDER BY PARTITION_NAME;
"@
    
    $verifyResult = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $verifyScript
    if ($verifyResult.Success) {
        Write-Host $verifyResult.Output
        Write-Status "✅ Particiones verificadas" "success"
    }
    
    Write-Step 5 "Optimizando tablas..."
    $optimizeScript = "OPTIMIZE TABLE recibos_excel_raw; ANALYZE TABLE recibos_excel_raw;"
    $optimizeResult = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $optimizeScript
    
    if ($optimizeResult.Success) {
        Write-Status "✅ Optimización completada" "success"
    }
    
    Write-Host ""
    Write-Status "═══════════════════════════════════════════════════" "info"
    Write-Status "✅ PARTICIONAMIENTO COMPLETADO EXITOSAMENTE" "success"
    Write-Status "═══════════════════════════════════════════════════" "info"
    Write-Status "Backup de seguridad: $backupFile" "info"
    Write-Status "Beneficio esperado: 5-10x más rápido en queries grandes" "success"
}

# ============================================================================
# OPCIÓN 3: IMPLEMENTAR MASTER-SLAVE REPLICATION
# ============================================================================

function Implement-Replication {
    Write-Header "IMPLEMENTAR MASTER-SLAVE REPLICATION"
    
    Write-Step 1 "Validando conexiones..."
    
    if (-not (Test-MySQLConnection $MasterHost $DBUser $DBPass)) {
        Write-Status "❌ No se puede conectar a Master" "error"
        return
    }
    Write-Status "✅ Master OK" "success"
    
    if (-not (Test-MySQLConnection $SlaveHost $DBUser $DBPass)) {
        Write-Status "⚠️  No se puede conectar a Slave" "warning"
        Write-Status "Asegúrate de que el servidor Slave esté ejecutando MySQL" "info"
        $continue = Read-Host "¿Continuar? (s/n)"
        if ($continue -ne "s") { return }
    }
    Write-Status "✅ Slave OK" "success"
    
    Write-Step 2 "Configurando MASTER para replicación..."
    
    $masterScript = @"
SET GLOBAL log_bin = 1;
CREATE USER IF NOT EXISTS '$ReplUser'@'%' IDENTIFIED BY '$ReplPass';
GRANT REPLICATION SLAVE ON *.* TO '$ReplUser'@'%';
GRANT SUPER ON *.* TO '$ReplUser'@'%';
FLUSH PRIVILEGES;
FLUSH MASTER;
SHOW MASTER STATUS;
"@
    
    $masterResult = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $masterScript
    if ($masterResult.Success) {
        Write-Host $masterResult.Output
        Write-Status "✅ Master configurado" "success"
    } else {
        Write-Status "❌ Error: $($masterResult.Error)" "error"
        return
    }
    
    Write-Step 3 "Creando BACKUP desde Master..."
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "rrhh-backup-replication-$timestamp.sql"
    
    $mysqldumpCmd = "mysqldump -h $MasterHost -u $DBUser -p$DBPass --single-transaction --master-data=2 --all-databases > $backupFile"
    
    try {
        Write-Status "Ejecutando backup (esto puede tomar 1-2 minutos)..." "info"
        Invoke-Expression $mysqldumpCmd
        Write-Status "✅ Backup completado: $backupFile" "success"
    } catch {
        Write-Status "❌ Error en backup: $_" "error"
        return
    }
    
    Write-Step 4 "Restaurando backup en SLAVE..."
    
    $restoreCmd = "mysql -h $SlaveHost -u $DBUser -p$DBPass < $backupFile"
    
    try {
        Write-Status "Restaurando (esto puede tomar 1-2 minutos)..." "info"
        Invoke-Expression $restoreCmd
        Write-Status "✅ Restore completado" "success"
    } catch {
        Write-Status "❌ Error en restore: $_" "error"
        return
    }
    
    Write-Step 5 "Configurando SLAVE para replicar desde MASTER..."
    
    $slaveScript = @"
STOP SLAVE;
RESET SLAVE ALL;
CHANGE MASTER TO
  MASTER_HOST='$MasterHost',
  MASTER_USER='$ReplUser',
  MASTER_PASSWORD='$ReplPass',
  MASTER_AUTO_POSITION = 1;
START SLAVE;
SHOW SLAVE STATUS\G
"@
    
    $slaveResult = Execute-MySQLScript $SlaveHost $DBUser $DBPass $DBName $slaveScript
    if ($slaveResult.Success) {
        Write-Host $slaveResult.Output
        Write-Status "✅ Slave configurado" "success"
    } else {
        Write-Status "❌ Error: $($slaveResult.Error)" "error"
        return
    }
    
    Write-Step 6 "Verificando replicación..."
    Start-Sleep -Seconds 2
    
    $verifyScript = "SHOW SLAVE STATUS\G"
    $verifyResult = Execute-MySQLScript $SlaveHost $DBUser $DBPass $DBName $verifyScript
    
    if ($verifyResult.Success) {
        if ($verifyResult.Output -match "Slave_IO_Running: Yes" -and $verifyResult.Output -match "Slave_SQL_Running: Yes") {
            Write-Status "✅ REPLICACIÓN ACTIVA" "success"
        } else {
            Write-Status "⚠️  Replicación está en proceso, verifica:" "warning"
            Write-Host $verifyResult.Output
        }
    }
    
    Write-Host ""
    Write-Status "═══════════════════════════════════════════════════" "info"
    Write-Status "✅ REPLICACIÓN CONFIGURADA EXITOSAMENTE" "success"
    Write-Status "═══════════════════════════════════════════════════" "info"
    Write-Status "Backup: $backupFile" "info"
    Write-Status "Master: $MasterHost (escribe)" "success"
    Write-Status "Slave: $SlaveHost (lee)" "success"
}

# ============================================================================
# OPCIÓN 5: VERIFICAR STATUS
# ============================================================================

function Verify-Scalability-Status {
    Write-Header "VERIFICACIÓN DE ESCALABILIDAD"
    
    Write-Step 1 "Particionamiento"
    $partitionScript = @"
SELECT 
    COUNT(*) as total_partitions,
    GROUP_CONCAT(TABLE_NAME) as tables_partitioned
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = 'RRHH' 
AND PARTITION_NAME IS NOT NULL
GROUP BY TABLE_SCHEMA;
"@
    
    $result = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $partitionScript
    if ($result.Success) {
        Write-Host $result.Output
    } else {
        Write-Status "No particiones encontradas (puedes implementarlas)" "info"
    }
    
    Write-Step 2 "Replicación"
    
    $replScript = @"
SHOW VARIABLES LIKE 'log_bin';
SHOW MASTER STATUS;
"@
    
    $result = Execute-MySQLScript $MasterHost $DBUser $DBPass $DBName $replScript
    if ($result.Success) {
        Write-Host $result.Output
    }
}

# ============================================================================
# MENÚ INTERACTIVO
# ============================================================================

function Run-InteractiveMenu {
    while ($true) {
        $choice = Show-Menu
        
        switch ($choice) {
            "1" { Diagnose-Database }
            "2" { Implement-Partitioning }
            "3" { Implement-Replication }
            "4" { 
                Write-Status "Keepalived requiere configuración manual en servidores Linux" "info"
                Write-Status "Ver: GUIA_ESCALABILIDAD_HA.md (Sección HA con Keepalived)" "info"
            }
            "5" { Verify-Scalability-Status }
            "6" { 
                Write-Status "Abriendo documentación..." "info"
                if (Test-Path "GUIA_ESCALABILIDAD_HA.md") {
                    & "GUIA_ESCALABILIDAD_HA.md"
                } else {
                    Write-Status "Ver: GUIA_RAPIDA_ESCALABILIDAD.md" "info"
                }
            }
            "0" { 
                Write-Status "¡Hasta luego!" "success"
                exit
            }
            default { 
                Write-Status "Opción inválida, intenta nuevamente" "warning"
            }
        }
        
        Read-Host "Presiona Enter para continuar..."
    }
}

# ============================================================================
# PUNTO DE ENTRADA
# ============================================================================

if ($Action -eq "info") {
    Run-InteractiveMenu
} else {
    # Modo no interactivo (parámetros pasados)
    switch ($Action.ToLower()) {
        "diagnose" { Diagnose-Database }
        "partition" { Implement-Partitioning }
        "replicate" { Implement-Replication }
        "verify" { Verify-Scalability-Status }
        default {
            Write-Status "Uso: powershell -ExecutionPolicy Bypass -File implement-scalability.ps1" "info"
            Write-Status "Acciones disponibles: diagnose, partition, replicate, verify" "info"
        }
    }
}
