# 🚀 PASOS INMEDIATOS PARA DESPLIEGUE

## 📍 Estado Actual
✅ Código funcionando localmente  
✅ Dockerfiles creados  
✅ Scripts de build preparados  
✅ Configuración para producción lista  

## 🎯 Objetivo
Desplegar en http://rrhh.dbconsulting.com.ar usando Docker

---

## 🔥 PASO 1: Construir y Subir Imágenes (Desde tu PC)

### Windows PowerShell
```powershell
# Ir al directorio del proyecto
cd "C:\Users\Usuario\Desktop\sistema-rrhh mas nuevo\sistema-rrhh"

# Hacer login en Docker Hub
docker login
# Usuario: elcheloide
# Password: [tu password de Docker Hub]

# Ejecutar el script de build y push
.\build-and-push.ps1
```

**¿Qué hace este script?**
- Construye la imagen del backend
- Construye la imagen del frontend
- Las sube a Docker Hub como:
  - `elcheloide/sistema-rrhh-backend:latest`
  - `elcheloide/sistema-rrhh-frontend:latest`

**Tiempo estimado**: 10-15 minutos

---

## 🖥️ PASO 2: Preparar el Servidor (VM)

### 2.1. Conectar al servidor via SSH

```bash
ssh usuario@IP_DE_TU_VM
```

### 2.2. Instalar Docker y Docker Compose (si no están)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Cerrar sesión y volver a entrar para que los cambios surtan efecto
exit
# Volver a conectar
ssh usuario@IP_DE_TU_VM

# Verificar instalación
docker --version
docker compose version
```

### 2.3. Crear estructura de directorios

```bash
# Crear directorio principal
mkdir -p ~/sistema-rrhh/backend/uploads
cd ~/sistema-rrhh
```

**Nota importante sobre uploads**: 
- Los archivos actuales en `backend/uploads/` están incluidos en la imagen Docker
- Se desplegarán automáticamente la primera vez
- Nuevos uploads se guardarán en el volumen del servidor

---

## 📦 PASO 3: Copiar Archivos al Servidor

### Opción A: Desde tu PC con SCP (Windows)

```powershell
# Copiar docker-compose de producción
scp "docker-compose.prod.yml" usuario@IP_VM:~/sistema-rrhh/docker-compose.yml

# Copiar .env
scp ".env.production" usuario@IP_VM:~/sistema-rrhh/.env
```

### Opción B: Crear archivos manualmente en el servidor

```bash
# En el servidor, crear docker-compose.yml
nano ~/sistema-rrhh/docker-compose.yml
```

Copiar el contenido de `docker-compose.prod.yml`

```bash
# Crear archivo .env
nano ~/sistema-rrhh/.env
```

Copiar este contenido:
```env
DB_HOST=34.176.128.94
DB_USER=root
DB_PASSWORD=pos38ric0S
DB_NAME=RRHH
DB_PORT=3306
JWT_SECRET=claveultrasecreta123
NODE_ENV=production
```

---

## 🚀 PASO 4: Levantar la Aplicación

```bash
cd ~/sistema-rrhh

# Descargar las imágenes desde Docker Hub
docker compose pull

# Levantar los servicios
docker compose up -d

# Verificar que estén corriendo
docker compose ps
```

**Esperado**: 
```
NAME              STATUS        PORTS
rrhh-backend      Up (healthy)  0.0.0.0:3001->3001/tcp
rrhh-frontend     Up (healthy)  0.0.0.0:80->80/tcp
```

### Verificar logs

```bash
# Ver todos los logs
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend
```

---

## 🔍 PASO 5: Verificaciones en el Servidor

```bash
# 1. Health check del backend
curl http://localhost:3001/api/health
# Debe devolver: {"status":"ok"}

# 2. Frontend carga
curl http://localhost:80
# Debe devolver HTML

# 3. API a través del proxy
curl http://localhost/api/health
# Debe devolver: {"status":"ok"}
```

---

## 🌐 PASO 6: Configurar DNS

### En tu proveedor de DNS (para dbconsulting.com.ar)

Crear un registro A:
- **Tipo**: A
- **Nombre**: rrhh (o rrhh.dbconsulting.com.ar)
- **Valor**: [IP_PUBLICA_DE_TU_VM]
- **TTL**: 300

### Verificar DNS (esperar 5-15 minutos)

```bash
# Desde cualquier lugar
nslookup rrhh.dbconsulting.com.ar

# Hacer ping
ping rrhh.dbconsulting.com.ar
```

---

## 🎉 PASO 7: Acceder a la Aplicación

Abrir en el navegador:
```
http://rrhh.dbconsulting.com.ar
```

**Deberías ver**: La página de login del sistema RRHH

**Probar login** con las credenciales de administrador

---

## ✅ Checklist de Verificación

- [ ] Las imágenes se construyeron y subieron correctamente
- [ ] Docker está instalado en el servidor
- [ ] Los archivos están copiados al servidor
- [ ] Los contenedores están corriendo y "healthy"
- [ ] El backend responde en localhost:3001
- [ ] El frontend carga en localhost:80
- [ ] El DNS está configurado y propagado
- [ ] La aplicación carga desde http://rrhh.dbconsulting.com.ar
- [ ] Puedes hacer login y usar la aplicación

---

## 🆘 Si Algo Sale Mal

### Los contenedores no inician
```bash
docker compose logs
docker compose restart
```

### No puedes acceder desde el dominio
```bash
# Verificar DNS
nslookup rrhh.dbconsulting.com.ar

# Verificar que el servidor esté escuchando
sudo netstat -tulpn | grep :80

# Verificar firewall
sudo ufw status
```

### Error de conexión a la base de datos
```bash
# Verificar desde el contenedor
docker exec rrhh-backend node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host:'34.176.128.94',user:'root',password:'pos38ric0S'}).then(() => console.log('BD OK')).catch(e => console.log('Error:', e.message))"
```

### Empezar de cero
```bash
docker compose down -v
docker compose pull
docker compose up -d
```

---

## 📞 Comandos Útiles de Mantenimiento

```bash
# Ver estado
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar todo
docker compose restart

# Actualizar a nueva versión
docker compose pull && docker compose up -d

# Ver uso de recursos
docker stats

# Detener todo
docker compose down
```

---

## 📚 Documentación de Referencia

- **GUIA_DESPLIEGUE_VM.md**: Guía completa paso a paso
- **CHECKLIST_DOCKER.md**: Checklist detallado
- **README_DOCKER.md**: Documentación técnica completa
- **GUIA_HTTPS_CADDY.md**: Para cuando quieras implementar HTTPS

---

## 🎯 Siguiente Paso Después del Despliegue

Una vez que todo funcione con HTTP, puedes implementar HTTPS con Caddy siguiendo `GUIA_HTTPS_CADDY.md`

**Tiempo total estimado**: 30-45 minutos (sin contar propagación de DNS)

---

## 💡 Resumen en 3 Pasos

1. **En tu PC**: Ejecutar `.\build-and-push.ps1`
2. **En el servidor**: Copiar archivos y ejecutar `docker compose up -d`
3. **Configurar DNS**: Apuntar rrhh.dbconsulting.com.ar a la IP del servidor

**¡Eso es todo! 🚀**
