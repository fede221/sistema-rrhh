#!/bin/sh
# Script de inicialización para copiar archivos de uploads si no existen

UPLOADS_DIR="/app/uploads"
UPLOADS_BACKUP="/app/uploads-initial"

# Si el directorio de uploads está vacío (solo contiene . y ..)
if [ -z "$(ls -A $UPLOADS_DIR 2>/dev/null)" ]; then
    echo "📁 Directorio uploads está vacío, copiando archivos iniciales..."
    
    # Si existe un backup de uploads iniciales, copiarlos
    if [ -d "$UPLOADS_BACKUP" ] && [ "$(ls -A $UPLOADS_BACKUP)" ]; then
        cp -r $UPLOADS_BACKUP/* $UPLOADS_DIR/
        echo "✅ Archivos de uploads copiados: $(ls $UPLOADS_DIR | wc -l) archivos"
    else
        echo "⚠️  No se encontraron archivos iniciales para copiar"
    fi
else
    echo "✅ Directorio uploads ya contiene archivos: $(ls $UPLOADS_DIR | wc -l) archivos"
fi

# Iniciar la aplicación
exec node index.js
