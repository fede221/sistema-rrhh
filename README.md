# 🏢 Sistema RRHH - Gestión de Recursos Humanos

## 📋 Descripción
Sistema completo de gestión de recursos humanos desarrollado con React y Node.js. Incluye gestión de usuarios, legajos, recibos de sueldo, vacaciones y permisos.

## 🚀 Características Principales

- **👥 Gestión de Usuarios**: Creación, edición y administración de empleados
- **📄 Legajos**: Administración completa de expedientes de empleados
- **💰 Recibos de Sueldo**: Generación y firma digital de recibos
- **🏖️ Vacaciones**: Solicitud y aprobación de vacaciones
- **📝 Permisos**: Gestión de permisos y ausencias
- **📊 Dashboard**: Panel de control con métricas y estadísticas
- **🔐 Autenticación**: Sistema seguro con JWT
- **📱 Responsive**: Compatible con dispositivos móviles

## 🛠️ Tecnologías

### Frontend
- React 19.1.0
- Material-UI (MUI) 7.2.0
- React Router 6.30.1
- Axios para HTTP requests

### Backend
- Node.js con Express 5.1.0
- MySQL como base de datos
- JWT para autenticación
- bcrypt para hash de contraseñas
- multer para upload de archivos

### DevOps
- Docker y Docker Compose
- Caddy como reverse proxy
- PM2 para gestión de procesos

## 🐋 Instalación con Docker (Recomendado)

### Prerequisitos
- Docker Desktop
- Git

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/fede221/sistema-rrhh.git
cd sistema-rrhh
```

2. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp .env.docker .env

# Editar .env con tus configuraciones
```

3. **Dockerizar**
```bash
# Windows
dockerizar.bat

# Linux/Mac
docker-compose up -d --build
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## 💻 Instalación Manual

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurar variables en .env
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 📝 Variables de Entorno

### Backend (.env)
```env
DB_HOST=tu_host_mysql
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=RRHH
DB_PORT=3306
JWT_SECRET=tu_jwt_secret_muy_seguro
CORS_ORIGIN=http://localhost:3000,https://tu-dominio.com
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:3001
```

## 🗄️ Base de Datos

El sistema requiere una base de datos MySQL. Las tablas principales incluyen:

- `usuarios`: Información de usuarios del sistema
- `legajos`: Expedientes de empleados
- `recibos_excel_raw`: Datos de recibos de sueldo
- `empresas`: Información de empresas
- `vacaciones`: Solicitudes de vacaciones
- `permisos`: Permisos y ausencias

## 🔐 Autenticación y Roles

### Roles disponibles:
- **superadmin**: Acceso total al sistema
- **admin_rrhh**: Administración de RRHH
- **empleado**: Acceso básico (ver sus propios datos)
- **referente**: Gestión de equipos específicos
- **referente_vacaciones**: Aprobación de vacaciones

### Primer acceso:
```bash
# Crear usuario administrador
npm run create-admin
# Usuario: 88888888 / Password: admin123
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/recovery-questions/:dni` - Preguntas de recuperación

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Editar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Legajos
- `GET /api/legajos/mi-legajo` - Obtener legajo propio
- `POST /api/legajos` - Crear legajo
- `PUT /api/legajos/:id` - Actualizar legajo

### Recibos
- `GET /api/recibos/mis-recibos` - Obtener recibos propios
- `POST /api/recibos/firmar` - Firmar recibo
- `GET /api/recibos/html` - Generar PDF de recibo

## 🧪 Testing

```bash
# Backend - Test de integración
cd backend
npm test

# Frontend - Tests unitarios
cd frontend
npm test
```

## 📦 Despliegue

### Con Docker (Producción)
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Manual
```bash
# Backend
npm run start:pm2

# Frontend
npm run build
# Servir con nginx/apache
```

## 🛡️ Seguridad

- Autenticación JWT con expiración
- Hash de contraseñas con bcrypt
- CORS configurado
- Headers de seguridad
- Validación de inputs
- Sanitización de datos

## 📊 Monitoreo

- Health checks automáticos
- Logs centralizados
- Métricas de sistema en `/api/health`

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- Crear un [Issue](https://github.com/fede221/sistema-rrhh/issues) para reportar bugs
- Ver [Wiki](https://github.com/fede221/sistema-rrhh/wiki) para documentación adicional

## 🔄 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para historial de cambios.

---

**Desarrollado con ❤️ para la gestión eficiente de recursos humanos**