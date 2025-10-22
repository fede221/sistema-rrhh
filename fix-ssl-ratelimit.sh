#!/bin/bash
# Script para manejar el rate limit de Let's Encrypt

echo "🔍 Verificando certificados SSL existentes..."

# Verificar si hay certificados de producción válidos
echo ""
echo "📋 Certificados de producción disponibles:"
docker exec rrhh-caddy sh -c "ls -lah /data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/rrhh.dbconsulting.com.ar/ 2>/dev/null || echo 'No hay certificados de producción'"

echo ""
echo "📋 Certificados de staging disponibles:"
docker exec rrhh-caddy sh -c "ls -lah /data/caddy/certificates/acme-staging-v02.api.letsencrypt.org-directory/rrhh.dbconsulting.com.ar/ 2>/dev/null || echo 'No hay certificados de staging'"

echo ""
echo "🔐 Información de certificados activos:"
docker exec rrhh-caddy caddy list-certificates 2>/dev/null || echo "Comando no disponible"

echo ""
echo "⏰ Rate limit activo hasta: 2025-10-19 10:35:36 UTC"
echo ""
echo "💡 Opciones disponibles:"
echo "1. ✅ Usar certificado staging (temporal, con advertencia en navegador)"
echo "2. ⏰ Esperar hasta el domingo 19/10 a las 10:35 AM"
echo "3. 🔑 Usar certificado de producción existente (si está disponible)"
echo ""

read -p "¿Deseas continuar usando el certificado staging actual? (s/n): " respuesta

if [[ "$respuesta" == "s" || "$respuesta" == "S" ]]; then
    echo ""
    echo "✅ Certificado staging ya está activo"
    echo "⚠️  Los usuarios verán una advertencia de seguridad en el navegador"
    echo "   pero el sitio funcionará normalmente"
    echo ""
    echo "🔗 Accede a: https://rrhh.dbconsulting.com.ar"
    echo "   (Acepta la advertencia de seguridad en tu navegador)"
else
    echo ""
    echo "⏭️  Para usar certificado de producción, espera hasta:"
    echo "   Domingo 19 de Octubre de 2025 - 10:35 AM UTC"
    echo ""
    echo "   Luego ejecuta:"
    echo "   docker-compose -f docker-compose.caddy.yml restart caddy"
fi
