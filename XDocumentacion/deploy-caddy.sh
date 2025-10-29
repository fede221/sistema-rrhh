#!/bin/bash
# Script para desplegar Caddy con HTTPS
# Ejecutar desde /home/RRHH/ en el servidor

echo "🔄 Iniciando despliegue de Caddy para HTTPS..."

# 1. Backup de configuración actual
echo "📦 Creando backup de docker-compose.yml..."
cp docker-compose.yml docker-compose.http.yml.backup
echo "✅ Backup creado: docker-compose.http.yml.backup"

# 2. Aplicar configuración con Caddy
echo "📝 Aplicando docker-compose.caddy.yml..."
cp docker-compose.caddy.yml docker-compose.yml
echo "✅ Configuración actualizada"

# 3. Detener servicios actuales
echo "🛑 Deteniendo servicios actuales..."
docker compose down
echo "✅ Servicios detenidos"

# 4. Iniciar servicios con Caddy
echo "🚀 Iniciando servicios con Caddy..."
docker compose up -d
echo "✅ Servicios iniciados"

# 5. Esperar 10 segundos para que Caddy arranque
echo "⏳ Esperando 10 segundos para que Caddy inicie..."
sleep 10

# 6. Verificar logs de Caddy
echo ""
echo "📋 Logs de Caddy (últimas 30 líneas):"
docker compose logs --tail=30 caddy

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "🔍 Verificaciones recomendadas:"
echo "1. Verificar certificado SSL: docker compose logs caddy | grep certificate"
echo "2. Acceder a: https://rrhh.dbconsulting.com.ar"
echo "3. Ver logs en tiempo real: docker compose logs -f caddy"
echo ""
echo "🔙 Si necesitas volver atrás:"
echo "   docker compose down"
echo "   cp docker-compose.http.yml.backup docker-compose.yml"
echo "   docker compose up -d"
