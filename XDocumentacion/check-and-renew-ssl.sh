#!/bin/bash
# Script para verificar y renovar certificado SSL después del rate limit
# Ejecutar después de las 10:37 AM UTC del 19/10/2025

echo "🔍 Verificando estado actual del certificado SSL..."
echo ""

# Verificar hora actual
CURRENT_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
echo "⏰ Hora actual del servidor: $CURRENT_TIME"
echo "🎯 Rate limit expira: 2025-10-19 10:37:00 UTC"
echo ""

# Verificar certificados actuales
echo "📋 Certificados actuales:"
docker exec rrhh-caddy sh -c "ls -lh /data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/rrhh.dbconsulting.com.ar/ 2>/dev/null | grep -v total"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Hay certificados de producción disponibles"
    
    # Verificar fecha de expiración
    echo ""
    echo "📅 Verificando expiración del certificado:"
    docker exec rrhh-caddy sh -c "openssl x509 -in /data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/rrhh.dbconsulting.com.ar/rrhh.dbconsulting.com.ar.crt -noout -dates 2>/dev/null"
else
    echo ""
    echo "⚠️  No hay certificados de producción - usando staging"
fi

echo ""
echo "🔄 Verificando logs recientes de Caddy:"
docker logs rrhh-caddy --tail 20 | grep -i "certificate\|error\|obtain"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Opciones disponibles:"
echo ""
echo "1️⃣  Esperar que Caddy renueve automáticamente (Recomendado)"
echo "   - Caddy reintentará en los próximos minutos"
echo "   - Monitorea con: docker logs -f rrhh-caddy | grep certificate"
echo ""
echo "2️⃣  Forzar renovación inmediata"
echo "   - Ejecuta: docker restart rrhh-caddy"
echo "   - O ejecuta: docker exec rrhh-caddy caddy reload --config /etc/caddy/Caddyfile"
echo ""
echo "3️⃣  Verificar que funcionó"
echo "   - Espera 2 minutos después del restart"
echo "   - Ejecuta este script nuevamente"
echo "   - O verifica con: curl -I https://rrhh.dbconsulting.com.ar"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "¿Deseas forzar la renovación ahora? (s/n): " respuesta

if [[ "$respuesta" == "s" || "$respuesta" == "S" ]]; then
    echo ""
    echo "🔄 Reiniciando Caddy para forzar renovación..."
    docker restart rrhh-caddy
    
    echo ""
    echo "⏳ Esperando 30 segundos para que Caddy se inicie..."
    sleep 30
    
    echo ""
    echo "📋 Verificando logs de renovación:"
    docker logs rrhh-caddy --tail 50 | grep -i "certificate\|obtain\|error"
    
    echo ""
    echo "✅ Proceso completado"
    echo "🔍 Verifica en el navegador: https://rrhh.dbconsulting.com.ar"
    echo "   (Ya no debería mostrar advertencia de seguridad)"
else
    echo ""
    echo "⏭️  Renovación no forzada - Caddy lo hará automáticamente"
    echo ""
    echo "📊 Monitorea el progreso con:"
    echo "   docker logs -f rrhh-caddy | grep -i certificate"
fi
