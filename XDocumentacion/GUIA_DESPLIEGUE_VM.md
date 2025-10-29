# Guía de Despliegue en Máquina Virtual

## 📋 Prerrequisitos en la VM

1. **Sistema Operativo**: Ubuntu 20.04 o superior (recomendado)
2. **Docker**: versión 20.10 o superior
3. **Docker Compose**: versión 2.0 o superior
4. **Puertos abiertos**: 80 (HTTP), 3001 (Backend - opcional)

## 🚀 Pasos para el Despliegue

### 1. Preparar las Imágenes Docker (desde tu máquina local)

```powershell
# Ejecutar el script de build y push
.\build-and-push.ps1
```

Este script:
- Hace login en Docker Hub
- Construye las imágenes del backend y frontend
- Las sube a Docker Hub con el tag `latest`

### 2. Configurar la Máquina Virtual

#### 2.1. Instalar Docker y Docker Compose (si no están instalados)

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

# Verificar instalación
docker --version
docker compose version
```

#### 2.2. Crear directorio del proyecto

```bash
# Crear directorio
mkdir -p ~/sistema-rrhh
cd ~/sistema-rrhh

# Crear directorio para uploads
mkdir -p backend/uploads
```

#### 2.3. Copiar archivos necesarios a la VM

Desde tu máquina local, copiar al servidor:

```powershell
# Copiar docker-compose.prod.yml
scp docker-compose.prod.yml usuario@IP_VM:~/sistema-rrhh/docker-compose.yml

# Copiar .env.production
scp .env.production usuario@IP_VM:~/sistema-rrhh/.env
```

O crear el archivo `.env` manualmente en la VM:

```bash
nano ~/sistema-rrhh/.env
```

```env
# Database
DB_HOST=34.176.128.94
DB_USER=root
DB_PASSWORD=pos38ric0S
DB_NAME=RRHH
DB_PORT=3306

# JWT Secret
JWT_SECRET=claveultrasecreta123

# Node Environment
NODE_ENV=production
```

### 3. Iniciar la Aplicación

```bash
cd ~/sistema-rrhh

# Descargar las imágenes y levantar los contenedores
docker compose up -d

# Verificar que los contenedores están corriendo
docker compose ps

# Ver los logs
docker compose logs -f
```

### 4. Configurar el DNS

En tu proveedor de DNS, crear un registro A:

```
Tipo: A
Nombre: rrhh.dbconsulting.com.ar
Valor: IP_DE_TU_VM
TTL: 300 (o el mínimo permitido)
```

### 5. Verificar el Funcionamiento

```bash
# Verificar health del backend
curl http://localhost:3001/api/health

# Verificar frontend
curl http://localhost:80

# Verificar desde internet (después de configurar DNS)
curl http://rrhh.dbconsulting.com.ar
```

## 🔧 Comandos Útiles

### Gestión de Contenedores

```bash
# Ver estado
docker compose ps

# Ver logs
docker compose logs -f
docker compose logs backend -f
docker compose logs frontend -f

# Reiniciar servicios
docker compose restart

# Detener servicios
docker compose down

# Actualizar a nuevas versiones
docker compose pull
docker compose up -d

# Ver uso de recursos
docker stats
```

### Mantenimiento

```bash
# Limpiar imágenes antiguas
docker image prune -a

# Backup de uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/

# Ver logs del sistema
docker compose logs --tail=100 backend
```

## 🔒 Seguridad (para implementar después)

### Firewall

```bash
# Configurar UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### HTTPS con Caddy (para más adelante)

Cuando quieras habilitar HTTPS:

1. Instalar Caddy en la VM
2. Configurar reverse proxy
3. Caddy manejará automáticamente los certificados SSL

## 📊 Monitoreo

### Health Checks

Los contenedores tienen health checks integrados:

```bash
# Ver estado de salud
docker inspect rrhh-backend | grep -A 10 Health
docker inspect rrhh-frontend | grep -A 10 Health
```

### Logs

```bash
# Logs en tiempo real
docker compose logs -f --tail=50

# Guardar logs
docker compose logs > logs-$(date +%Y%m%d).txt
```

## 🆘 Troubleshooting

### Los contenedores no inician

```bash
# Ver logs detallados
docker compose logs

# Verificar que las imágenes se descargaron
docker images | grep sistema-rrhh

# Reiniciar Docker
sudo systemctl restart docker
```

### No se puede acceder desde el dominio

```bash
# Verificar que nginx está escuchando
docker exec rrhh-frontend netstat -tulpn | grep :80

# Verificar DNS
nslookup rrhh.dbconsulting.com.ar

# Verificar conectividad
ping rrhh.dbconsulting.com.ar
```

### Problemas de base de datos

```bash
# Verificar conectividad desde el backend
docker exec rrhh-backend wget -O- http://localhost:3001/api/health
```

## 🔄 Actualización de la Aplicación

Cuando hagas cambios y quieras actualizar:

1. **En tu máquina local**: Ejecutar `.\build-and-push.ps1`
2. **En la VM**:
   ```bash
   cd ~/sistema-rrhh
   docker compose pull
   docker compose up -d
   ```

## 📝 Notas Importantes

- Por ahora trabajamos con HTTP (puerto 80)
- Las credenciales de DB están en el .env (NO subir a git)
- Los uploads se guardan en `backend/uploads/`
- Más adelante implementaremos HTTPS con Caddy
- Asegúrate de que el firewall del proveedor cloud permita tráfico al puerto 80

## 🎯 URLs de Acceso

- **Frontend**: http://rrhh.dbconsulting.com.ar
- **Backend API**: http://rrhh.dbconsulting.com.ar/api/
- **Health Check**: http://rrhh.dbconsulting.com.ar/api/health
