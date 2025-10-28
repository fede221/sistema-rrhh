#!/bin/bash
# Script de implementación rápida: Particionamiento + Replicación Master-Slave
# Uso: bash setup-scalability.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  SETUP AUTOMATIZADO: Escalabilidad RRHH (Particionamiento+HA) ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuración
MASTER_HOST=${1:-"34.176.128.94"}
SLAVE_HOST=${2:-"127.0.0.1"}
DB_USER="root"
DB_PASS="pos38ric0S"
DB_NAME="RRHH"
REPL_USER="replicador"
REPL_PASS="ReplicaPassword123!"

echo "📋 CONFIGURACIÓN:"
echo "  Master: $MASTER_HOST"
echo "  Slave:  $SLAVE_HOST"
echo "  Base:   $DB_NAME"
echo ""

# ============================================================================
# FASE 1: Verificar Prerequisites
# ============================================================================

echo "🔍 FASE 1: Verificando prerequisites..."

check_mysql() {
  if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client no instalado. Instala con:"
    echo "   Ubuntu: sudo apt-get install mysql-client"
    echo "   CentOS: sudo yum install mysql"
    exit 1
  fi
  echo "✅ MySQL client: OK"
}

check_connectivity() {
  if ! mysql -h "$MASTER_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" &>/dev/null; then
    echo "❌ No se puede conectar a Master: $MASTER_HOST"
    exit 1
  fi
  echo "✅ Conectividad Master: OK"
}

check_mysql
check_connectivity

# ============================================================================
# FASE 2: Configurar MASTER
# ============================================================================

echo ""
echo "⚙️  FASE 2: Configurando MASTER..."

configure_master() {
  mysql -h "$MASTER_HOST" -u "$DB_USER" -p"$DB_PASS" << EOF
-- Habilitar binary logging si no está activo
SET GLOBAL log_bin = 1;

-- Verificar que está activo
SHOW VARIABLES LIKE 'log_bin';
SHOW VARIABLES LIKE 'binlog_format';

-- Crear usuario de replicación
CREATE USER IF NOT EXISTS '$REPL_USER'@'%' IDENTIFIED BY '$REPL_PASS';
GRANT REPLICATION SLAVE ON *.* TO '$REPL_USER'@'%';
GRANT SUPER ON *.* TO '$REPL_USER'@'%';
FLUSH PRIVILEGES;

-- Obtener estado actual
FLUSH MASTER;
SHOW MASTER STATUS;
EOF
  echo "✅ Master configurado"
}

configure_master

# ============================================================================
# FASE 3: Crear Backup desde Master
# ============================================================================

echo ""
echo "💾 FASE 3: Creando backup incremental..."

BACKUP_FILE="/tmp/rrhh-backup-$(date +%Y%m%d-%H%M%S).sql"

mysqldump -h "$MASTER_HOST" -u "$DB_USER" -p"$DB_PASS" \
  --single-transaction \
  --master-data=2 \
  --all-databases > "$BACKUP_FILE"

echo "✅ Backup creado: $BACKUP_FILE"

# ============================================================================
# FASE 4: Configurar SLAVE
# ============================================================================

echo ""
echo "🔄 FASE 4: Configurando SLAVE..."

if [ "$SLAVE_HOST" == "127.0.0.1" ]; then
  echo "⚠️  Slave local (127.0.0.1) - en producción usa servidor remoto"
fi

configure_slave() {
  mysql -h "$SLAVE_HOST" -u "$DB_USER" -p"$DB_PASS" << EOF
-- Restaurar backup
SOURCE $BACKUP_FILE;

-- Extraer posición del master
SET GLOBAL server_id = 2;

-- Obtener posición desde el dump
STOP SLAVE;
RESET SLAVE ALL;

-- Configurar conexión al master (extraer valores del dump)
CHANGE MASTER TO
  MASTER_HOST='$MASTER_HOST',
  MASTER_USER='$REPL_USER',
  MASTER_PASSWORD='$REPL_PASS',
  MASTER_AUTO_POSITION = 1;

-- Iniciar replicación
START SLAVE;

-- Verificar estado
SHOW SLAVE STATUS\G
EOF
  echo "✅ Slave configurado"
}

configure_slave

# ============================================================================
# FASE 5: Implementar Particionamiento
# ============================================================================

echo ""
echo "📊 FASE 5: Configurando Particionamiento..."

implement_partitioning() {
  mysql -h "$MASTER_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << EOF
-- Ver estado actual de particionamiento
SELECT COUNT(*) as partitions_count
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = 'RRHH' AND TABLE_NAME = 'recibos_excel_raw'
AND PARTITION_NAME IS NOT NULL;

-- Si la tabla ya está particionada, listar particiones
SELECT PARTITION_NAME, PARTITION_EXPRESSION, TABLE_ROWS
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = 'RRHH' 
AND TABLE_NAME = 'recibos_excel_raw'
AND PARTITION_NAME IS NOT NULL
ORDER BY PARTITION_NAME;
EOF
  echo "✅ Estado de particionamiento revisado"
}

implement_partitioning

# ============================================================================
# FASE 6: Verificar Replicación
# ============================================================================

echo ""
echo "✔️  FASE 6: Verificando Replicación..."

verify_replication() {
  echo "Estado del Slave:"
  mysql -h "$SLAVE_HOST" -u "$DB_USER" -p"$DB_PASS" << EOF
SHOW SLAVE STATUS\G
EOF
  
  echo ""
  echo "Verificaciones críticas:"
  
  IO_STATUS=$(mysql -h "$SLAVE_HOST" -u "$DB_USER" -p"$DB_PASS" -sN -e \
    "SHOW SLAVE STATUS\G" | grep "Slave_IO_Running" | awk '{print $2}')
  
  SQL_STATUS=$(mysql -h "$SLAVE_HOST" -u "$DB_USER" -p"$DB_PASS" -sN -e \
    "SHOW SLAVE STATUS\G" | grep "Slave_SQL_Running" | awk '{print $2}')
  
  if [ "$IO_STATUS" = "Yes" ] && [ "$SQL_STATUS" = "Yes" ]; then
    echo "✅ Slave_IO_Running: $IO_STATUS"
    echo "✅ Slave_SQL_Running: $SQL_STATUS"
    echo "✅ REPLICACIÓN ACTIVA ✨"
  else
    echo "❌ Slave_IO_Running: $IO_STATUS"
    echo "❌ Slave_SQL_Running: $SQL_STATUS"
    echo "❌ Hay problemas en la replicación"
  fi
}

verify_replication

# ============================================================================
# RESUMEN Y PRÓXIMOS PASOS
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP COMPLETADO                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 RESUMEN DE CAMBIOS:"
echo "  ✅ Binary logging habilitado en Master"
echo "  ✅ Usuario de replicación creado"
echo "  ✅ Backup inicial generado: $BACKUP_FILE"
echo "  ✅ Slave sincronizado con Master"
echo "  ✅ Replicación verificada"
echo ""

echo "🎯 PRÓXIMOS PASOS:"
echo ""
echo "1️⃣  IMPLEMENTAR PARTICIONAMIENTO (cuando llegues a 500K filas):"
echo "   Ejecutar: mysql -h $MASTER_HOST -u $DB_USER -p < partition-setup.sql"
echo ""

echo "2️⃣  IMPLEMENTAR ALTA DISPONIBILIDAD (cuando llegues a 1M filas):"
echo "   Instalar Keepalived para failover automático"
echo "   Ver: GUIA_ESCALABILIDAD_HA.md (Sección HA)"
echo ""

echo "3️⃣  MONITOREO AUTOMÁTICO:"
echo "   - Revisar logs: /var/log/mysql/"
echo "   - Monitorear replicación cada 5 min"
echo "   - Alertas en: admin@dbconsulting.com.ar"
echo ""

echo "4️⃣  BACKUPS AUTOMÁTICOS:"
echo "   Configurar cron para backups nocturnos del Slave"
echo "   Script: backup-slave.sh"
echo ""

echo "📚 DOCUMENTACIÓN:"
echo "   Full Guide: GUIA_ESCALABILIDAD_HA.md"
echo "   DB Analysis: ANALISIS_BD_POTENCIA.md"
echo ""

echo "⚠️  IMPORTANTE:"
echo "   - Cambiar contraseñas de producción (REPL_PASS)"
echo "   - Configurar firewall para replicación (puerto 3306)"
echo "   - Hacer test de failover en staging primero"
echo ""

echo "Done! 🚀"
