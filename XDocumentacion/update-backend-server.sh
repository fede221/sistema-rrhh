#!/bin/bash
# Script para actualizar el backend en el servidor con las correcciones

echo "🚀 Actualizando backend con correcciones de healthcheck..."

# Verificar que docker-compose.caddy.yml existe
if [ ! -f "docker-compose.caddy.yml" ]; then
    echo "❌ Error: No se encuentra docker-compose.caddy.yml"
    echo "   Ejecuta este script desde el directorio donde está el docker-compose"
    exit 1
fi

# Pull de la nueva imagen
echo "📥 Descargando última imagen del backend..."
docker-compose -f docker-compose.caddy.yml pull backend

if [ $? -ne 0 ]; then
    echo "❌ Error al descargar la imagen"
    exit 1
fi

echo "✅ Imagen descargada exitosamente"

# Recrear solo el contenedor backend
echo "🔄 Recreando contenedor backend..."
docker-compose -f docker-compose.caddy.yml up -d backend

if [ $? -ne 0 ]; then
    echo "❌ Error al recrear el contenedor"
    exit 1
fi

echo "✅ Contenedor recreado exitosamente"
echo ""
echo "⏳ Esperando 60 segundos para que el healthcheck se ejecute..."
sleep 60

# Verificar estado del contenedor
echo ""
echo "📊 Estado del contenedor:"
docker ps --filter name=rrhh-backend --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "🔍 Probando health check..."
curl -s http://localhost:3001/api/health | jq '.'

echo ""
echo "✅ Actualización completada"
echo "📄 Monitorea los logs con: docker logs -f rrhh-backend"
