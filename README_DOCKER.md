# Sistema RRHH - Despliegue con Docker

## 🎯 Resumen

Este proyecto está preparado para desplegarse en una máquina virtual usando Docker y Docker Compose, accesible desde http://rrhh.dbconsulting.com.ar

## 📦 Arquitectura

- **Backend**: Node.js + Express (Puerto 3001)
- **Frontend**: React + Nginx (Puerto 80)
- **Base de Datos**: MySQL externa (Google Cloud)
- **Reverse Proxy**: Nginx (en el contenedor del frontend)

## 🚀 Inicio Rápido

### Desde tu máquina local (Windows)

```powershell
# 1. Construir y subir imágenes a Docker Hub
.\build-and-push.ps1

# Esto creará y subirá:
# - elcheloide/sistema-rrhh-backend:latest
# - elcheloide/sistema-rrhh-frontend:latest
```

### En el servidor (Linux VM)

```bash
# 1. Clonar o copiar archivos
mkdir ~/sistema-rrhh && cd ~/sistema-rrhh

# 2. Copiar docker-compose.prod.yml como docker-compose.yml
# 3. Crear archivo .env con las variables de entorno

# 4. Levantar servicios
docker compose up -d

# 5. Verificar
docker compose ps
docker compose logs -f
```

## 📁 Estructura de Archivos Docker

```
sistema-rrhh/
├── backend/
│   ├── Dockerfile              # Imagen del backend
│   └── .dockerignore          # Archivos ignorados en build
├── frontend/
│   ├── Dockerfile              # Multi-stage build (Node + Nginx)
│   ├── nginx.conf             # Configuración de Nginx
│   └── .dockerignore          # Archivos ignorados en build
├── docker-compose.yml          # Desarrollo
├── docker-compose.prod.yml     # Producción
├── .env.production            # Variables de entorno (NO subir a git)
├── build-and-push.ps1         # Script Windows para build
└── build-and-push.sh          # Script Linux para build
```

## 🔑 Variables de Entorno

Crear archivo `.env` en el servidor:

```env
# Base de Datos MySQL
DB_HOST=tu_servidor_mysql
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_seguro
DB_NAME=RRHH
DB_PORT=3306

# JWT Secret - Genera uno con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=tu_jwt_secret_muy_seguro_de_128_caracteres_minimo

NODE_ENV=production
```

⚠️ **IMPORTANTE SEGURIDAD:**
- Nunca uses usuario `root` para aplicaciones
- Genera JWT_SECRET con al menos 64 bytes aleatorios
- Usa contraseñas fuertes (mínimo 16 caracteres, letras, números, símbolos)
- NO compartas estas credenciales en Git, Slack, o email

## 🌐 Configuración de Red

### Nginx como Reverse Proxy

El frontend (Nginx) maneja:
- **Archivos estáticos**: Servidos directamente desde `/usr/share/nginx/html`
- **API requests**: Proxy a `http://backend:3001/api/`
- **React Router**: Todas las rutas devuelven `index.html`

### Puertos

- `80`: Frontend (Nginx) - acceso público
- `3001`: Backend - comunicación interna entre contenedores

## 🔧 Comandos Útiles

```bash
# Ver estado
docker compose ps

# Logs en tiempo real
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f backend

# Reiniciar servicios
docker compose restart

# Actualizar a nuevas versiones
docker compose pull && docker compose up -d

# Detener todo
docker compose down

# Limpiar todo (cuidado: borra volúmenes)
docker compose down -v
```

## 🔍 Health Checks

Ambos servicios tienen health checks automáticos:

```bash
# Backend
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:80

# Verificar desde afuera
curl http://rrhh.dbconsulting.com.ar/api/health
```

## 📊 Monitoreo

```bash
# Ver recursos usados
docker stats

# Ver estado de health checks
docker inspect rrhh-backend | grep -A 10 Health
docker inspect rrhh-frontend | grep -A 10 Health
```

## 🔄 Proceso de Actualización

1. **Hacer cambios en el código**
2. **Construir y subir nuevas imágenes**:
   ```powershell
   .\build-and-push.ps1
   ```
3. **En el servidor, actualizar**:
   ```bash
   docker compose pull
   docker compose up -d
   ```

## 🔒 Seguridad

### Actual (HTTP)
- Puerto 80 abierto
- Sin encriptación

### Futuro (HTTPS con Caddy)
- Puerto 443 con SSL automático
- Redirección HTTP → HTTPS
- Certificados Let's Encrypt automáticos

## 🆘 Troubleshooting

### Los contenedores no inician

```bash
docker compose logs
docker compose restart
```

### Problemas de conexión con la DB

```bash
# Probar desde el contenedor (usa las credenciales de tu .env)
docker exec rrhh-backend node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD}).then(() => console.log('OK')).catch(e => console.error(e))"

# O verificar variables de entorno
docker exec rrhh-backend env | grep DB_
```

### Frontend no muestra datos

```bash
# Verificar que el proxy funciona
docker exec rrhh-frontend curl http://backend:3001/api/health
```

### Limpiar todo y empezar de nuevo

```bash
docker compose down -v
docker compose up -d
```

## 📝 Notas Importantes

- ⚠️ **NO subir** `.env` o `.env.production` a git
- 📁 Los uploads se guardan en volumen persistente
- 🔄 Los health checks tardan ~40s en el backend (start_period)
- 🌐 El DNS debe apuntar a la IP pública de la VM
- 🔐 Más adelante implementaremos HTTPS con Caddy

## 🎯 URLs

- **Aplicación**: http://rrhh.dbconsulting.com.ar
- **API**: http://rrhh.dbconsulting.com.ar/api/
- **Health**: http://rrhh.dbconsulting.com.ar/api/health

## 📚 Documentación Adicional

- `GUIA_DESPLIEGUE_VM.md`: Guía paso a paso del despliegue completo
- `CHECKLIST_DEPLOY.md`: Checklist de verificación
