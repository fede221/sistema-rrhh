# ✅ Checklist de Despliegue Docker

## 📋 Pre-Despliegue (En tu máquina local)

### Preparación de Código

- [ ] Todo el código está committeado
- [ ] Las credenciales están en variables de entorno, no hardcoded
- [ ] El frontend usa `/api` para rutas de API en producción
- [ ] Los health checks funcionan correctamente

### Build de Imágenes

- [ ] Docker Desktop está corriendo
- [ ] Tienes cuenta en Docker Hub (usuario: `elcheloide`)
- [ ] Hiciste login: `docker login`
- [ ] Ejecutaste el script de build:
  ```powershell
  .\build-and-push.ps1
  ```
- [ ] Las imágenes se subieron correctamente:
  - `elcheloide/sistema-rrhh-backend:latest`
  - `elcheloide/sistema-rrhh-frontend:latest`

### Verificación Local (Opcional)

- [ ] Probaste las imágenes localmente:
  ```powershell
  docker-compose -f docker-compose.prod.yml up
  ```
- [ ] El backend responde en http://localhost:3001/api/health
- [ ] El frontend carga en http://localhost:80
- [ ] Puedes hacer login y navegar la aplicación

## 🖥️ Servidor (Máquina Virtual)

### Prerrequisitos

- [ ] VM con Ubuntu 20.04+ está creada
- [ ] Tienes acceso SSH al servidor
- [ ] Docker está instalado:
  ```bash
  docker --version
  ```
- [ ] Docker Compose está instalado:
  ```bash
  docker compose version
  ```
- [ ] Puertos 80 y 3001 están abiertos en el firewall

### Preparación del Servidor

- [ ] Directorio creado:
  ```bash
  mkdir -p ~/sistema-rrhh/backend/uploads
  cd ~/sistema-rrhh
  ```
- [ ] Archivo `docker-compose.yml` copiado (desde `docker-compose.prod.yml`)
- [ ] Archivo `.env` creado con las variables correctas:
  - DB_HOST
  - DB_USER
  - DB_PASSWORD
  - DB_NAME
  - JWT_SECRET
  - NODE_ENV=production
- [ ] Permisos correctos en el directorio uploads:
  ```bash
  chmod 755 backend/uploads
  ```

### Despliegue

- [ ] Descargaste las imágenes:
  ```bash
  docker compose pull
  ```
- [ ] Levantaste los servicios:
  ```bash
  docker compose up -d
  ```
- [ ] Los contenedores están corriendo:
  ```bash
  docker compose ps
  # Ambos deben estar "Up" y "healthy"
  ```
- [ ] Los logs no muestran errores:
  ```bash
  docker compose logs
  ```

### Verificaciones en el Servidor

- [ ] Health check del backend:
  ```bash
  curl http://localhost:3001/api/health
  # Debe devolver: {"status":"ok"}
  ```
- [ ] Frontend carga:
  ```bash
  curl http://localhost:80
  # Debe devolver HTML
  ```
- [ ] La API responde a través del proxy:
  ```bash
  curl http://localhost/api/health
  # Debe devolver: {"status":"ok"}
  ```
- [ ] Los contenedores están healthy:
  ```bash
  docker inspect rrhh-backend | grep -i health
  docker inspect rrhh-frontend | grep -i health
  ```

## 🌐 Configuración DNS

- [ ] Tienes acceso al panel de DNS de dbconsulting.com.ar
- [ ] IP pública de la VM está identificada
- [ ] Registro A creado:
  - **Nombre**: rrhh.dbconsulting.com.ar
  - **Tipo**: A
  - **Valor**: [IP_PUBLICA_VM]
  - **TTL**: 300
- [ ] DNS propagado (esperar 5-15 minutos):
  ```bash
  nslookup rrhh.dbconsulting.com.ar
  ```
- [ ] Ping al dominio funciona:
  ```bash
  ping rrhh.dbconsulting.com.ar
  ```

## 🔍 Verificaciones Finales

### Acceso Externo

- [ ] Abre http://rrhh.dbconsulting.com.ar en el navegador
- [ ] La página carga correctamente
- [ ] Puedes hacer login con las credenciales
- [ ] Las funcionalidades principales funcionan:
  - [ ] Ver dashboard
  - [ ] Gestión de legajos
  - [ ] Gestión de permisos
  - [ ] Gestión de vacaciones
  - [ ] Recibos de sueldo
  - [ ] Usuarios

### Base de Datos

- [ ] La conexión a la BD externa funciona
- [ ] Puedes ver datos existentes
- [ ] Puedes crear nuevos registros
- [ ] Los uploads funcionan correctamente

### Performance

- [ ] La aplicación carga en < 3 segundos
- [ ] No hay errores en la consola del navegador
- [ ] Las imágenes y archivos estáticos cargan correctamente

## 📱 Pruebas Adicionales

- [ ] Probaste desde diferentes navegadores (Chrome, Firefox, Edge)
- [ ] Probaste desde dispositivos móviles
- [ ] Probaste desde diferentes redes (WiFi, 4G)
- [ ] Las sesiones persisten correctamente
- [ ] El logout funciona correctamente

## 🔐 Seguridad (Configuración Inicial)

- [ ] El archivo `.env` NO está en git
- [ ] Las credenciales de DB son seguras
- [ ] JWT_SECRET es único y seguro
- [ ] Firewall configurado (solo 22, 80 abiertos)
  ```bash
  sudo ufw status
  ```

## 📊 Monitoreo

- [ ] Configuraste un script para verificar el estado:
  ```bash
  # Crear check-status.sh
  #!/bin/bash
  echo "=== Estado de contenedores ==="
  docker compose ps
  echo ""
  echo "=== Health checks ==="
  curl -s http://localhost:3001/api/health
  echo ""
  curl -s http://localhost/api/health
  ```
- [ ] Sabes cómo ver los logs:
  ```bash
  docker compose logs -f
  ```

## 📝 Documentación

- [ ] Guardaste las credenciales en un lugar seguro
- [ ] Documentaste la IP del servidor
- [ ] Tienes respaldo del archivo `.env`
- [ ] Conoces los comandos básicos de mantenimiento

## 🆘 Plan de Contingencia

- [ ] Sabes cómo reiniciar los servicios:
  ```bash
  docker compose restart
  ```
- [ ] Sabes cómo ver logs de errores:
  ```bash
  docker compose logs --tail=100
  ```
- [ ] Sabes cómo hacer rollback a versión anterior (si es necesario)
- [ ] Tienes backup de la base de datos (si aplica)

## 🔄 Próximos Pasos (Futuro)

- [ ] Implementar HTTPS con Caddy
- [ ] Configurar backups automáticos
- [ ] Implementar monitoreo con Prometheus/Grafana (opcional)
- [ ] Configurar alertas
- [ ] Implementar CI/CD (opcional)

---

## ✅ Despliegue Completado

Si todos los items están marcados, ¡felicitaciones! 🎉

Tu aplicación está desplegada y funcionando en:
**http://rrhh.dbconsulting.com.ar**

### Comandos Rápidos de Referencia

```bash
# Ver estado
docker compose ps

# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart

# Actualizar
docker compose pull && docker compose up -d

# Detener
docker compose down
```
