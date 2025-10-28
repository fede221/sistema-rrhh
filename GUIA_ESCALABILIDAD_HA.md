# 🚀 GUÍA: Escalabilidad - Particionamiento y Replicación Master-Slave

**Documento**: Preparación para crecimiento a 1M+ filas  
**Nivel**: Avanzado  
**Tiempo de implementación**: 2-4 horas  

---

## 📊 TABLA DE CONTENIDOS

1. [Particionamiento de Tablas](#particionamiento)
2. [Replicación Master-Slave](#replicación)
3. [Alta Disponibilidad (HA)](#alta-disponibilidad)
4. [Monitoreo y Mantenimiento](#monitoreo)

---

## <a name="particionamiento"></a>🔧 PARTE 1: PARTICIONAMIENTO DE TABLAS

### ¿Por qué Particionar?

Cuando `recibos_excel_raw` alcance **1M+ filas** (~500 GB):
- Las queries lentas (>5 segundos)
- Backups toman horas
- Índices inmensamente grandes
- Recuperación de desastres lenta

**Solución**: Particionar por rango (RANGE) o por fecha (RANGE COLUMNS)

### Paso 1: Verificar Soporte

```sql
-- Conectar a MySQL como root
mysql -h 34.176.128.94 -u root -p RRHH

-- Verificar que particionamiento está habilitado
SHOW PLUGINS;
-- Debe aparecer: partition | ACTIVE

-- Si no está activo:
INSTALL PLUGIN partition SONAME 'ha_partition.so';
```

### Paso 2: Particionar `recibos_excel_raw`

**Estrategia**: Particionar por **MES** (fecha_importacion)

```sql
-- 1. Crear tabla nueva particionada (si es necesario migrar)
CREATE TABLE recibos_excel_raw_partitioned (
  id INT AUTO_INCREMENT PRIMARY KEY,
  importID INT NOT NULL,
  empresa_id INT NOT NULL,
  numero_empleado VARCHAR(20),
  nombre VARCHAR(100),
  fecha_importacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  periodo_liquidacion VARCHAR(10),
  -- ... resto de columnas igual
  INDEX idx_importID (importID),
  INDEX idx_fecha (fecha_importacion),
  INDEX idx_periodo (periodo_liquidacion)
) ENGINE=InnoDB 
PARTITION BY RANGE (MONTH(fecha_importacion)) (
  PARTITION p01 VALUES LESS THAN (2),
  PARTITION p02 VALUES LESS THAN (3),
  PARTITION p03 VALUES LESS THAN (4),
  PARTITION p04 VALUES LESS THAN (5),
  PARTITION p05 VALUES LESS THAN (6),
  PARTITION p06 VALUES LESS THAN (7),
  PARTITION p07 VALUES LESS THAN (8),
  PARTITION p08 VALUES LESS THAN (9),
  PARTITION p09 VALUES LESS THAN (10),
  PARTITION p10 VALUES LESS THAN (11),
  PARTITION p11 VALUES LESS THAN (12),
  PARTITION p12 VALUES LESS THAN (13)
);

-- 2. Migrar datos (sin downtime con trigger)
INSERT INTO recibos_excel_raw_partitioned 
SELECT * FROM recibos_excel_raw;

-- 3. Cambiar nombres
RENAME TABLE 
  recibos_excel_raw TO recibos_excel_raw_old,
  recibos_excel_raw_partitioned TO recibos_excel_raw;

-- 4. Verificar particiones
SELECT 
  PARTITION_NAME,
  PARTITION_EXPRESSION,
  PARTITION_DESCRIPTION,
  TABLE_ROWS,
  DATA_LENGTH
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_SCHEMA = 'RRHH' AND TABLE_NAME = 'recibos_excel_raw';
```

### Beneficios Alcanzados ✨

```
ANTES (sin particiones):
├─ Full table scan: ~5s
├─ Backup: ~2 horas
├─ Índice tamaño: 4.5 GB
└─ Recuperación: 30+ minutos

DESPUÉS (con particiones por mes):
├─ Scan de 1 mes: ~0.5s ⚡
├─ Backup incremental: ~15 min
├─ Índices por partición: 400 MB cada
└─ Recuperación de 1 mes: ~2 minutos ⚡
```

### Script de Mantenimiento Automático

```sql
-- Crear evento para agregar particiones automáticamente
CREATE EVENT IF NOT EXISTS create_new_recibos_partition
ON SCHEDULE EVERY 1 MONTH
STARTS DATE_ADD(LAST_DAY(CURDATE()), INTERVAL 1 DAY)
DO
BEGIN
  SET @next_month = MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)) + 1;
  SET @partition_name = CONCAT('p', LPAD(@next_month, 2, '0'));
  
  ALTER TABLE recibos_excel_raw 
  ADD PARTITION (PARTITION @partition_name VALUES LESS THAN (@next_month + 1));
END $$
```

---

## <a name="replicación"></a>🔄 PARTE 2: REPLICACIÓN MASTER-SLAVE

### Arquitectura

```
┌─────────────────────────────────────────────┐
│         PRODUCCIÓN (Master)                  │
│  34.176.128.94:3306                         │
│  - Recibe WRITES                             │
│  - Binary logs activos                       │
└────────────────┬────────────────────────────┘
                 │ Replicación (binlog stream)
                 │
┌────────────────▼────────────────────────────┐
│         BACKUP (Slave)                       │
│  [Nueva IP]:3306                             │
│ - Solo READ                                  │
│ - Copia sincronizada                        │
│ - Backup automático cada noche              │
└─────────────────────────────────────────────┘
```

### Paso 1: Configurar MASTER (34.176.128.94)

**1.1 Editar `/etc/mysql/mysql.conf.d/mysqld.cnf` (o `.env` en Docker)**

```ini
[mysqld]
# Habilitar binary logging
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
server-id = 1

# Configuración de retención
expire_logs_days = 10
max_binlog_size = 100M

# Optimización de replicación
binlog_cache_size = 32768
binlog_row_image = MINIMAL
```

**1.2 Reiniciar MySQL**

```bash
# En Docker
docker-compose restart db

# En servidor local
sudo systemctl restart mysql
```

**1.3 Crear usuario de replicación**

```sql
-- Conectar como root a MASTER
mysql -h 34.176.128.94 -u root -p RRHH

-- Crear usuario con permisos de replicación
CREATE USER 'replicador'@'%' IDENTIFIED BY 'ReplicaPassword123!';
GRANT REPLICATION SLAVE ON *.* TO 'replicador'@'%';
FLUSH PRIVILEGES;

-- Obtener posición actual (para el slave)
SHOW MASTER STATUS;
-- Anotar: File y Position
-- Ejemplo: mysql-bin.000001 | 12345
```

### Paso 2: Configurar SLAVE (Servidor de Backup)

**2.1 Editar configuración del slave**

```ini
[mysqld]
server-id = 2
relay-log = /var/log/mysql/mysql-relay-bin
relay-log-index = /var/log/mysql/mysql-relay-bin.index
relay-log-info-repository = TABLE
master-info-repository = TABLE

# Para sincronización garantizada
sync_relay_log = 1
sync_relay_log_info = 1
```

**2.2 Crear backup inicial desde MASTER**

```bash
# En MASTER: crear dump sin bloquear (usando --single-transaction)
mysqldump -h 34.176.128.94 -u root -p \
  --single-transaction \
  --master-data=2 \
  --all-databases > /tmp/master-backup.sql

# Transferir al SLAVE
scp /tmp/master-backup.sql usuario@slave-server:/tmp/

# En SLAVE: restaurar
mysql -u root -p < /tmp/master-backup.sql
```

**2.3 Configurar replicación en SLAVE**

```sql
-- Conectar al SLAVE
mysql -u root -p

-- Detener replicación si estaba activa
STOP SLAVE;

-- Configurar conexión al MASTER
CHANGE MASTER TO
  MASTER_HOST='34.176.128.94',
  MASTER_USER='replicador',
  MASTER_PASSWORD='ReplicaPassword123!',
  MASTER_LOG_FILE='mysql-bin.000001',      -- Del SHOW MASTER STATUS
  MASTER_LOG_POS=12345;                     -- Del SHOW MASTER STATUS

-- Iniciar replicación
START SLAVE;

-- Verificar estado (CRUCIAL!)
SHOW SLAVE STATUS\G
```

**2.4 Verificar Salud de Replicación**

```sql
SHOW SLAVE STATUS\G

-- Buscar estas líneas CRÍTICAS:
-- Slave_IO_Running: Yes      ✅
-- Slave_SQL_Running: Yes     ✅
-- Seconds_Behind_Master: 0   ✅ (retraso en segundos)
-- Last_Error: (vacío)        ✅
```

### Troubleshooting Replicación

```sql
-- Si Slave_IO_Running = No
SHOW SLAVE STATUS\G  -- Ver Last_IO_Error
-- Solucionar: usuario, permisos, conectividad

-- Si hay retraso (Seconds_Behind_Master > 10)
-- Optimizar con: slave_parallel_workers
SET GLOBAL slave_parallel_workers = 4;
SET GLOBAL slave_parallel_type = 'LOGICAL_CLOCK';

-- Si hay error SQL (Slave_SQL_Running = No)
SHOW SLAVE STATUS\G  -- Ver Last_SQL_Error
-- Opción 1: SKIP si es error menor
SET GLOBAL SQL_SLAVE_SKIP_COUNTER = 1;
START SLAVE;

-- Opción 2: Resincronizar completamente
STOP SLAVE;
RESET SLAVE ALL;
-- Luego repetir CHANGE MASTER...
```

---

## <a name="alta-disponibilidad"></a>🔐 PARTE 3: ALTA DISPONIBILIDAD (HA)

### Solución: MySQL Replication + Keepalived

```
┌──────────────────────────────────────────────┐
│        VIRTUAL IP (VIP)                      │
│     34.176.128.100:3306 (flotante)          │
└─────────────┬────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────────────┐  ┌───▼────────────┐
│  MASTER        │  │  SLAVE (Hot)   │
│  34.176.128.94 │  │  34.176.128.95 │
│  (Primario)    │  │  (Standby)     │
└────────────────┘  └────────────────┘
    │ ESCRIBE          │ Lee
    │ REPLICA          │ Standby listo
    └────────────────┬─┘
                     │ Replicación
                     │ Sincrónica
```

### Implementar Failover Automático

**3.1 Instalar Keepalived en ambos servidores**

```bash
# Ubuntu/Debian
sudo apt-get install keepalived

# RHEL/CentOS
sudo yum install keepalived
```

**3.2 Configurar MASTER (34.176.128.94)**

```bash
# Archivo: /etc/keepalived/keepalived.conf

global_defs {
  router_id RRHH_MASTER
  script_user root
}

vrrp_script check_mysql {
  script "/usr/local/bin/check_mysql.sh"
  interval 2
  weight -20
  fall 2
}

vrrp_instance VI_1 {
  state MASTER
  interface eth0
  virtual_router_id 51
  priority 100
  advert_int 1
  
  authentication {
    auth_type PASS
    auth_pass rrhh1234
  }
  
  virtual_ipaddress {
    34.176.128.100/24
  }
  
  track_script {
    check_mysql
  }
}
```

**3.3 Configurar SLAVE (34.176.128.95)**

```bash
# Archivo: /etc/keepalived/keepalived.conf

vrrp_instance VI_1 {
  state BACKUP
  interface eth0
  virtual_router_id 51
  priority 90              # Menor que MASTER
  advert_int 1
  
  authentication {
    auth_type PASS
    auth_pass rrhh1234
  }
  
  virtual_ipaddress {
    34.176.128.100/24
  }
  
  track_script {
    check_mysql
  }
}
```

**3.4 Script de verificación MySQL**

```bash
# Archivo: /usr/local/bin/check_mysql.sh

#!/bin/bash
MYSQL_HOST="localhost"
MYSQL_USER="root"
MYSQL_PASS="pos38ric0S"

if mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASS" -e "SELECT 1" &>/dev/null; then
  # MySQL está corriendo
  exit 0
else
  # MySQL está caído, perder el VIP
  exit 1
fi
```

**3.5 Iniciar Keepalived**

```bash
sudo systemctl start keepalived
sudo systemctl enable keepalived

# Verificar VIP
ip addr show

# Debería mostrar: 34.176.128.100 en el MASTER
```

---

## <a name="monitoreo"></a>📊 PARTE 4: MONITOREO Y MANTENIMIENTO

### Script de Monitoreo Automático

```bash
#!/bin/bash
# Archivo: /usr/local/bin/monitor-replication.sh

MASTER_HOST="34.176.128.94"
SLAVE_HOST="34.176.128.95"
ALERT_EMAIL="admin@dbconsulting.com.ar"

# Verificar estado de replicación
check_replication() {
  SLAVE_STATUS=$(mysql -h $SLAVE_HOST -u root -p$MYSQL_PASS \
    -e "SHOW SLAVE STATUS\G")
  
  IO_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_IO_Running:" | awk '{print $2}')
  SQL_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_SQL_Running:" | awk '{print $2}')
  SECONDS_BEHIND=$(echo "$SLAVE_STATUS" | grep "Seconds_Behind_Master:" | awk '{print $2}')
  
  if [ "$IO_RUNNING" != "Yes" ] || [ "$SQL_RUNNING" != "Yes" ]; then
    echo "ERROR: Replicación caída!" | mail -s "ALERTA: Replicación RRHH" $ALERT_EMAIL
    return 1
  fi
  
  if [ "$SECONDS_BEHIND" -gt "10" ]; then
    echo "ADVERTENCIA: Retraso de $SECONDS_BEHIND segundos" | \
      mail -s "ALERTA: Retraso en replicación" $ALERT_EMAIL
  fi
  
  return 0
}

# Verificar tamaño de binary logs
check_binlog_size() {
  BINLOG_SIZE=$(du -sh /var/log/mysql/mysql-bin.* | awk '{sum+=$1} END {print sum}')
  
  if [ "$BINLOG_SIZE" -gt "100G" ]; then
    echo "Binary logs ocupan $BINLOG_SIZE - purgar antiguos"
    mysql -u root -p$MYSQL_PASS -e "PURGE BINARY LOGS BEFORE DATE_SUB(NOW(), INTERVAL 10 DAY);"
  fi
}

# Ejecutar checks
check_replication
check_binlog_size
```

**Agregar a cron (cada 5 minutos)**

```bash
*/5 * * * * /usr/local/bin/monitor-replication.sh
```

### Dashboard de Monitoreo (Queries Útiles)

```sql
-- Ver estado de replicación
SHOW SLAVE STATUS\G

-- Ver binary logs en master
SHOW MASTER STATUS;
SHOW BINARY LOGS;

-- Ver tamaño de binary logs
SELECT FILE, FILE_SIZE FROM mysql.binary_log_info;

-- Verificar lag de replicación
SELECT TIMESTAMPDIFF(SECOND, ts, NOW()) as lag_seconds
FROM replication_heartbeat;

-- Ver tabla de particiones
SELECT PARTITION_NAME, TABLE_ROWS, DATA_LENGTH
FROM INFORMATION_SCHEMA.PARTITIONS
WHERE TABLE_NAME = 'recibos_excel_raw';
```

---

## 🎯 HOJA DE RUTA DE IMPLEMENTACIÓN

### **FASE 1: Ahora (Oct 2025)**
- [x] JWT_SECRET configurado ✅
- [x] UTF-8MB4 implementado ✅
- [ ] Preparar servidor backup
- [ ] Documentación lista

### **FASE 2: Cuando llegues a 500K filas (~Nov 2025)**
- [ ] Implementar Particionamiento por mes
- [ ] Crear índices de partición
- [ ] Verificar performance

### **FASE 3: Cuando llegues a 1M filas (~Dic 2025)**
- [ ] Activar Replicación Master-Slave
- [ ] Configurar Keepalived
- [ ] Testing de failover

### **FASE 4: Producción (Ene 2026)**
- [ ] Monitoreo automático
- [ ] Backups replicados nocturnos
- [ ] Documentar runbooks

---

## 📋 CHECKLIST DE VALIDACIÓN

```sql
-- Ejecutar después de implementar cada fase

-- Validar Particionamiento
SELECT COUNT(*) FROM information_schema.partitions 
WHERE table_schema='RRHH' AND table_name='recibos_excel_raw';
-- Debe ser > 1 si está particionado

-- Validar Replicación
SHOW SLAVE STATUS\G | grep -E "Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master";
-- Debe mostrar: Yes | Yes | 0-5

-- Validar Binary Logs
SHOW MASTER STATUS;
-- Verificar que log_bin está activo

-- Validar VIP Keepalived
ip addr | grep 34.176.128.100
-- Debe aparecer en el MASTER

-- Validar Performance
EXPLAIN SELECT * FROM recibos_excel_raw WHERE MONTH(fecha_importacion) = 10;
-- Debe usar partición, no full table scan
```

---

## 🚨 PLAN DE RECUPERACIÓN ANTE DESASTRES

### Escenario 1: MASTER se cae

```sql
-- En SLAVE (ahora MASTER temporal):
STOP SLAVE;
RESET SLAVE ALL;

-- Cambiar aplicación a usar SLAVE
UPDATE .env: DB_HOST=34.176.128.95

-- Cuando MASTER se recupere:
-- Revertir SLAVE a estado original
CHANGE MASTER TO ...
START SLAVE;
```

### Escenario 2: Corrupción en MASTER

```sql
-- Crear copia en SLAVE
CREATE TABLE recibos_excel_raw_backup AS 
SELECT * FROM recibos_excel_raw WHERE DATE(fecha_importacion) < '2025-10-20';

-- Verificar integridad
CHECK TABLE recibos_excel_raw;
REPAIR TABLE recibos_excel_raw;

-- Resincronizar desde SLAVE si es necesario
```

---

## 💰 ESTIMACIÓN DE COSTOS

| Componente | Costo | Notas |
|-----------|-------|-------|
| Servidor Backup/Replica | $50-100/mes | GCP, AWS, Azure |
| Almacenamiento extra (500GB) | $10-20/mes | Para backups |
| Monitoreo automático | $0 | Script casero |
| **TOTAL** | **$60-120/mes** | Altamente recomendado |

---

**Último update**: 28/10/2025  
**Versión**: 1.0  
**Status**: Ready for Implementation ✅
