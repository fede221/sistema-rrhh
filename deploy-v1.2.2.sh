#!/bin/bash

# Script de deployment para Sistema RRHH v1.2.2
# Uso: ./deploy-v1.2.2.sh

set -e

echo "🚀 Iniciando deployment de Sistema RRHH v1.2.2..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté ejecutándose
print_status "Verificando Docker..."
if ! docker info >/dev/null 2>&1; then
    print_error "Docker no está ejecutándose. Por favor, inicia Docker y vuelve a intentar."
    exit 1
fi
print_success "Docker está ejecutándose"

# Verificar que docker-compose esté disponible
print_status "Verificando docker-compose..."
if ! command -v docker-compose >/dev/null 2>&1; then
    if ! docker compose version >/dev/null 2>&1; then
        print_error "docker-compose no está disponible. Por favor, instálalo y vuelve a intentar."
        exit 1
    else
        COMPOSE_CMD="docker compose"
    fi
else
    COMPOSE_CMD="docker-compose"
fi
print_success "docker-compose está disponible"

# Detener servicios existentes si están ejecutándose
print_status "Deteniendo servicios existentes..."
$COMPOSE_CMD down --remove-orphans || true
print_success "Servicios detenidos"

# Pull de las nuevas imágenes
print_status "Descargando imágenes v1.2.2..."
docker pull elcheloide/sistema-rrhh-backend:v1.2.2
docker pull elcheloide/sistema-rrhh-frontend:v1.2.2
print_success "Imágenes descargadas"

# Limpiar imágenes antiguas (opcional)
print_status "Limpiando imágenes antiguas..."
docker image prune -f
print_success "Limpieza completada"

# Crear directorios necesarios
print_status "Creando directorios necesarios..."
mkdir -p ./backend/uploads
mkdir -p ./logs
print_success "Directorios creados"

# Verificar archivo .env
if [ ! -f .env ]; then
    print_warning "Archivo .env no encontrado. Creando uno básico..."
    cat > .env << EOF
# Base de datos
DB_HOST=34.176.128.94
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=RRHH
DB_PORT=3306

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Entorno
NODE_ENV=production
EOF
    print_warning "¡IMPORTANTE! Edita el archivo .env con los valores correctos antes de continuar."
    read -p "Presiona Enter cuando hayas configurado el archivo .env..."
fi

# Iniciar servicios
print_status "Iniciando servicios v1.2.2..."
$COMPOSE_CMD -f docker-compose.server.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 30

# Verificar health checks
print_status "Verificando estado de los servicios..."

# Verificar backend
for i in {1..10}; do
    if curl -f -s http://localhost:3001/api/health >/dev/null; then
        print_success "Backend está funcionando"
        break
    else
        if [ $i -eq 10 ]; then
            print_error "Backend no responde después de 10 intentos"
            print_status "Mostrando logs del backend:"
            docker logs rrhh-backend --tail 50
            exit 1
        fi
        print_status "Esperando al backend... (intento $i/10)"
        sleep 10
    fi
done

# Verificar frontend
for i in {1..5}; do
    if curl -f -s http://localhost:80 >/dev/null; then
        print_success "Frontend está funcionando"
        break
    else
        if [ $i -eq 5 ]; then
            print_error "Frontend no responde después de 5 intentos"
            print_status "Mostrando logs del frontend:"
            docker logs rrhh-frontend --tail 50
            exit 1
        fi
        print_status "Esperando al frontend... (intento $i/5)"
        sleep 5
    fi
done

# Mostrar estado final
print_status "Estado de los contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

print_success "🎉 Deployment completado exitosamente!"
print_status "✅ Backend: http://localhost:3001"
print_status "✅ Frontend: http://localhost:80"
print_status "✅ Health Check: http://localhost:3001/api/health"

# Mostrar comandos útiles
echo ""
print_status "Comandos útiles:"
echo "  Ver logs:           $COMPOSE_CMD -f docker-compose.server.yml logs -f"
echo "  Reiniciar:          $COMPOSE_CMD -f docker-compose.server.yml restart"
echo "  Detener:            $COMPOSE_CMD -f docker-compose.server.yml down"
echo "  Ver estado:         docker ps"

print_success "Sistema RRHH v1.2.2 está listo! 🚀"