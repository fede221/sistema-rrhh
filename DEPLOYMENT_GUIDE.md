# 🌐 Configuración para Dominio: rrhh.dbconsulting.com.ar (Caddy)

## 📋 Lista de verificación para despliegue

### 1. DNS Configuration
- [ ] El dominio `rrhh.dbconsulting.com.ar` debe apuntar a la IP de tu servidor
- [ ] Configurar registro A: `rrhh.dbconsulting.com.ar` → `IP_DEL_SERVIDOR`

### 2. Certificados SSL ✨ AUTOMÁTICO ✨
- ✅ **Caddy gestiona automáticamente SSL con Let's Encrypt**
- ✅ **No necesitas configurar certificados manualmente**
- ✅ **Renovación automática de certificados**

### 3. Firewall/Security Groups
- [ ] Abrir puerto 80 (HTTP)
- [ ] Abrir puerto 443 (HTTPS)
- [ ] Abrir puerto 3001 (Backend API)

### 4. Variables de entorno verificadas
- [ ] `CORS_ORIGIN=https://rrhh.dbconsulting.com.ar`
- [ ] `REACT_APP_API_URL=https://rrhh.dbconsulting.com.ar`

## 🚀 Comandos de despliegue

### Para desplegar en producción:
```bash
# Windows
deploy-production.bat

# Linux/Mac
docker-compose -f docker-compose.production.yml up -d
```

### Para obtener certificados SSL (Let's Encrypt):
```bash
# Instalar certbot
sudo apt install certbot

# Obtener certificados
sudo certbot certonly --standalone -d rrhh.dbconsulting.com.ar

# Copiar certificados
sudo cp /etc/letsencrypt/live/rrhh.dbconsulting.com.ar/fullchain.pem ./ssl-certs/cert.pem
sudo cp /etc/letsencrypt/live/rrhh.dbconsulting.com.ar/privkey.pem ./ssl-certs/key.pem
```

## 🔧 Configuraciones realizadas

### Backend:
- ✅ CORS configurado para `https://rrhh.dbconsulting.com.ar`
- ✅ Variables de entorno para producción
- ✅ Health check endpoint

### Frontend (Caddy):
- ✅ **SSL automático con Let's Encrypt**
- ✅ **Redirección HTTP → HTTPS automática**
- ✅ Proxy reverso para API
- ✅ Build con URL de producción
- ✅ Headers de seguridad configurados
- ✅ Cache optimizado para archivos estáticos

### Docker:
- ✅ docker-compose.production.yml configurado
- ✅ Puertos 80, 443 expuestos
- ✅ Volúmenes persistentes para Caddy
- ✅ Health checks

## 🚀 Ventajas de Caddy vs Nginx

### ✨ **Ventajas principales:**
- 🔒 **SSL automático** - No configuración manual
- 🔄 **Renovación automática** de certificados
- 📝 **Configuración simple** - Caddyfile vs múltiples archivos
- ⚡ **HTTP/2 automático**
- 🛡️ **Headers de seguridad** incluidos por defecto
- 📊 **Logs estructurados** en JSON

## 🌐 URLs de acceso

- **Aplicación**: https://rrhh.dbconsulting.com.ar
- **API Backend**: https://rrhh.dbconsulting.com.ar/api
- **Health Check**: https://rrhh.dbconsulting.com.ar/api/health
- **Uploads**: https://rrhh.dbconsulting.com.ar/uploads

## 🔍 Troubleshooting

### Problema: Certificados SSL
```bash
# Verificar certificados
openssl x509 -in ssl-certs/cert.pem -text -noout

# Verificar clave privada
openssl rsa -in ssl-certs/key.pem -check
```

### Problema: DNS no resuelve
```bash
# Verificar DNS
nslookup rrhh.dbconsulting.com.ar
dig rrhh.dbconsulting.com.ar
```

### Problema: CORS
```bash
# Verificar logs del backend
docker-compose -f docker-compose.production.yml logs backend
```