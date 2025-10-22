#!/bin/bash
# Script para construir y subir las imágenes de Docker
# Ejecutar desde la raíz del proyecto

echo "=== Sistema RRHH - Build y Push de Imágenes Docker ==="
echo ""

# Variables
DOCKER_USER="elcheloide"
VERSION="latest"
BACKEND_IMAGE="${DOCKER_USER}/sistema-rrhh-backend:${VERSION}"
FRONTEND_IMAGE="${DOCKER_USER}/sistema-rrhh-frontend:${VERSION}"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

echo "1. Verificando login en Docker Hub..."
docker login
if [ $? -ne 0 ]; then
    echo "Error: No se pudo hacer login en Docker Hub"
    exit 1
fi

echo ""
echo "2. Construyendo imagen del Backend..."
cd backend
docker build -t $BACKEND_IMAGE .
if [ $? -ne 0 ]; then
    echo "Error: Falló la construcción del backend"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "3. Construyendo imagen del Frontend..."
cd frontend
docker build -t $FRONTEND_IMAGE .
if [ $? -ne 0 ]; then
    echo "Error: Falló la construcción del frontend"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "4. Subiendo imagen del Backend a Docker Hub..."
docker push $BACKEND_IMAGE
if [ $? -ne 0 ]; then
    echo "Error: Falló el push del backend"
    exit 1
fi

echo ""
echo "5. Subiendo imagen del Frontend a Docker Hub..."
docker push $FRONTEND_IMAGE
if [ $? -ne 0 ]; then
    echo "Error: Falló el push del frontend"
    exit 1
fi

echo ""
echo "=== ¡Build y Push completados exitosamente! ==="
echo ""
echo "Imágenes creadas y subidas:"
echo "  - $BACKEND_IMAGE"
echo "  - $FRONTEND_IMAGE"
echo ""
echo "Próximos pasos:"
echo "  1. Copiar docker-compose.prod.yml al servidor"
echo "  2. Crear archivo .env con las variables de entorno"
echo "  3. Ejecutar: docker-compose -f docker-compose.prod.yml up -d"
echo "  4. Configurar DNS apuntando rrhh.dbconsulting.com.ar a la IP del servidor"
