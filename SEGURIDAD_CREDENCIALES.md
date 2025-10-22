# 🔒 Guía de Seguridad - Gestión de Credenciales

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

Si este repositorio estuvo público o las credenciales fueron expuestas, debes **ROTAR INMEDIATAMENTE** todas las credenciales.

---

## 📋 Checklist de Seguridad Post-Exposición

- [ ] Cambiar contraseña de la base de datos
- [ ] Generar nuevo JWT_SECRET
- [ ] Revocar tokens JWT activos (reiniciar backend)
- [ ] Auditar logs de acceso a BD por actividad sospechosa
- [ ] Verificar que no haya usuarios no autorizados creados
- [ ] Cambiar contraseñas de admin en la aplicación
- [ ] Revisar firewall de base de datos (solo IPs permitidas)
- [ ] Considerar cambiar usuario de BD (no usar root)

---

## 🔑 1. ROTAR CONTRASEÑA DE BASE DE DATOS

### Paso 1: Conectarse a MySQL

```bash
# Desde la máquina con acceso a la BD
mysql -h tu_servidor -u root -p
```

### Paso 2: Cambiar contraseña del usuario root

```sql
-- Cambiar contraseña de root
ALTER USER 'root'@'%' IDENTIFIED BY 'nueva_password_muy_segura_16_caracteres_minimo';
FLUSH PRIVILEGES;

-- Verificar cambio
SELECT User, Host FROM mysql.user WHERE User='root';
```

### Paso 3: Crear usuario específico para la aplicación (RECOMENDADO)

```sql
-- Crear nuevo usuario para la app (NO root)
CREATE USER 'rrhh_app'@'%' IDENTIFIED BY 'password_fuerte_para_app';

-- Dar permisos SOLO a la base de datos RRHH
GRANT SELECT, INSERT, UPDATE, DELETE ON RRHH.* TO 'rrhh_app'@'%';

-- NO dar permisos DROP, CREATE TABLE, etc. en producción
FLUSH PRIVILEGES;

-- Verificar permisos
SHOW GRANTS FOR 'rrhh_app'@'%';
```

### Paso 4: Actualizar .env con nuevo usuario

```bash
DB_USER=rrhh_app
DB_PASSWORD=password_fuerte_para_app
```

---

## 🔐 2. GENERAR NUEVO JWT_SECRET

### Opción A: Con Node.js (Recomendado)

```bash
# Generar JWT_SECRET seguro de 128 caracteres
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ejemplo de salida:
# a7f8d9e2c1b4a5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4
```

### Opción B: Con OpenSSL

```bash
openssl rand -hex 64
```

### Actualizar .env

```bash
# Reemplazar el JWT_SECRET en tu archivo .env
JWT_SECRET=el_nuevo_secret_generado_arriba_de_128_caracteres
```

---

## 🔄 3. APLICAR CAMBIOS

### Paso 1: Actualizar archivo .env en el servidor

```bash
# Conectarse al servidor
ssh usuario@tu-servidor

# Editar .env
cd ~/sistema-rrhh
nano .env

# Actualizar DB_USER, DB_PASSWORD y JWT_SECRET
```

### Paso 2: Reiniciar servicios

```bash
# Reiniciar contenedores para que tomen nuevas variables
docker compose restart

# Verificar que levantaron correctamente
docker compose ps
docker compose logs -f backend
```

### Paso 3: Verificar conectividad

```bash
# Probar conexión a BD
docker exec rrhh-backend node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME}).then(() => console.log('✅ Conexión OK')).catch(e => console.error('❌ Error:', e.message))"

# Probar health check
curl http://localhost:3001/api/health
```

---

## 🛡️ 4. AUDITORÍA POST-ROTACIÓN

### Revisar logs de MySQL

```sql
-- Ver intentos de login recientes
SELECT * FROM mysql.general_log
WHERE command_type = 'Connect'
ORDER BY event_time DESC LIMIT 100;

-- Ver queries sospechosas (si está habilitado)
SELECT * FROM mysql.general_log
WHERE command_type = 'Query'
AND (argument LIKE '%DROP%' OR argument LIKE '%DELETE%')
ORDER BY event_time DESC;
```

### Revisar usuarios en la aplicación

```sql
USE RRHH;

-- Ver usuarios creados recientemente
SELECT id, legajo, dni, nombre, apellido, rol, activo, created_at
FROM usuarios
ORDER BY created_at DESC
LIMIT 20;

-- Buscar usuarios admin no autorizados
SELECT * FROM usuarios WHERE rol IN ('superadmin', 'admin_rrhh');
```

### Revisar logs de backend

```bash
# Ver logs del backend por actividad sospechosa
docker compose logs backend | grep -i "error\|401\|403\|500"

# Ver últimos logins
docker compose logs backend | grep -i "login"
```

---

## 🔥 5. FIREWALL DE BASE DE DATOS

### Google Cloud SQL

```bash
# Listar reglas actuales
gcloud sql instances describe NOMBRE_INSTANCIA

# Agregar solo IPs permitidas
gcloud sql instances patch NOMBRE_INSTANCIA \
  --authorized-networks=IP_SERVIDOR_APP

# Remover acceso global (0.0.0.0/0)
```

### iptables (Linux)

```bash
# Permitir solo IP del servidor de aplicación
sudo iptables -A INPUT -p tcp --dport 3306 -s IP_SERVIDOR_APP -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3306 -j DROP
```

---

## 📅 6. ROTACIÓN PERIÓDICA DE CREDENCIALES

### Calendario Recomendado

- **JWT_SECRET**: Cada 6 meses
- **Contraseña BD**: Cada 3-6 meses
- **Contraseña Admin**: Cada 3 meses
- **Auditoría de accesos**: Mensual

### Proceso de rotación JWT_SECRET sin downtime

1. Generar nuevo JWT_SECRET_2
2. Modificar código para aceptar ambos secrets temporalmente
3. Desplegar con ambos activos
4. Esperar que expiren todos los tokens viejos (1 hora)
5. Remover JWT_SECRET viejo
6. Desplegar con solo el nuevo secret

---

## ✅ 7. VERIFICACIÓN FINAL

```bash
# ✅ Credenciales actualizadas en .env
# ✅ Variables NO están hardcodeadas en código
# ✅ docker-compose.yml usa ${VARIABLE}
# ✅ Servicios reiniciados y funcionando
# ✅ Health check respondiendo OK
# ✅ Login funciona correctamente
# ✅ No hay credenciales en Git (revisar commits)
# ✅ Firewall de BD configurado
# ✅ Usuario específico creado (no root)
# ✅ Logs auditados sin actividad sospechosa
```

---

## 🆘 SOPORTE

Si detectas actividad sospechosa o compromiso de seguridad:

1. **Inmediato**: Cambiar TODAS las credenciales
2. **Inmediato**: Desactivar usuarios sospechosos
3. **Inmediato**: Revisar y limpiar datos comprometidos
4. **24h**: Auditoría completa de logs
5. **48h**: Análisis forense de seguridad
6. **7d**: Implementar medidas preventivas adicionales

---

## 📚 RECURSOS ADICIONALES

- [OWASP Credential Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Storage_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Google Cloud SQL Security Best Practices](https://cloud.google.com/sql/docs/mysql/security-best-practices)

---

**Última actualización**: 2025-10-22
**Próxima revisión recomendada**: 2025-11-22
