# 📁 Importante: Carpeta Uploads

## ⚠️ Contenido de la Imagen vs. Volumen

### En la Imagen Docker
La carpeta `backend/uploads/` **SÍ se incluye** en la imagen Docker con todos los archivos existentes:
- Los archivos actuales en `uploads/` se copiarán a la imagen
- Estos archivos estarán disponibles cuando se cree el contenedor por primera vez
- Archivos actuales incluidos:
  - `0cfb010534cc07c9ec106d83c34650e1.png`
  - `2bfb8f833362ab4e11ecfba1acf86b1c.png`
  - `2cbdf63d071c0d69c656fa8bdb92e5d2.png`
  - `54e1fcd68c45e074a3733863e862b858.png`
  - `6fcdc432537f9f4a19c56740915b5864.png`
  - `8ccce394010186334ea85a27ba8ef0c2.png`
  - `8fef39a8835c396963b9d03696ed3d50.png`
  - `bb5b71bd912abfaf4f8d4d22e40ecf5b.png`

### En el Servidor (Volumen)
El `docker-compose.prod.yml` monta un volumen local:
```yaml
volumes:
  - ./backend/uploads:/app/uploads
```

Esto significa:
1. **Primera vez**: Si no existe `./backend/uploads` en el servidor, Docker copiará el contenido de la imagen al host
2. **Siguientes veces**: El directorio local del servidor se monta sobre el del contenedor
3. **Nuevos uploads**: Se guardarán en el servidor, no en la imagen

## 🔄 Comportamiento en Producción

### Escenario 1: Primera Instalación
```bash
# En el servidor VM
cd ~/sistema-rrhh
mkdir -p backend/uploads  # Crear directorio vacío

# Al hacer docker compose up -d
# Docker copiará los archivos de la imagen al directorio local
```

### Escenario 2: Servidor con Uploads Existentes
```bash
# Si ya tienes uploads en el servidor
cd ~/sistema-rrhh/backend/uploads
ls  # Verás tus archivos actuales

# Al hacer docker compose up -d
# El contenedor usará los archivos del servidor (NO los de la imagen)
```

## 📋 Recomendaciones

### Para Despliegue Inicial
Si quieres que los archivos actuales estén disponibles en producción:

**Opción A: Incluidos en la imagen (actual)**
- ✅ Ya están en la imagen
- ✅ Se despliegan automáticamente
- ❌ Aumentan el tamaño de la imagen

**Opción B: Copiar manualmente al servidor**
```bash
# Desde tu PC
scp -r backend/uploads/* usuario@IP_VM:~/sistema-rrhh/backend/uploads/
```

### Para Backups
```bash
# En el servidor, crear backup
cd ~/sistema-rrhh
tar -czf uploads-backup-$(date +%Y%m%d-%H%M%S).tar.gz backend/uploads/

# Restaurar backup
tar -xzf uploads-backup-YYYYMMDD-HHMMSS.tar.gz
```

### Para Sincronizar entre Servidores
Si tienes múltiples servidores, puedes usar un volumen compartido o storage externo:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- NFS compartido

## 🔍 Verificar Uploads en el Contenedor

```bash
# Listar archivos dentro del contenedor
docker exec rrhh-backend ls -la /app/uploads

# Ver un archivo específico
docker exec rrhh-backend cat /app/uploads/archivo.txt

# Copiar archivos desde el contenedor al host
docker cp rrhh-backend:/app/uploads/archivo.png ./archivo.png

# Copiar archivos desde el host al contenedor
docker cp ./archivo.png rrhh-backend:/app/uploads/archivo.png
```

## 💡 Mejora Futura: Storage Externo

Para producción a gran escala, considera:

```javascript
// backend/config/storage.js
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

// Configurar storage en la nube
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'sistema-rrhh-uploads',
    key: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});
```

## 📊 Tamaño de la Imagen

Los archivos actuales ocupan poco espacio (~8 archivos PNG), por lo que **NO hay problema** en incluirlos en la imagen.

Si en el futuro tienes muchos uploads:
- Considera **NO** incluirlos en la imagen
- Usa storage externo (S3, GCS, Azure)
- O sincroniza manualmente al servidor

## ✅ Estado Actual

- ✅ Los archivos existentes en `backend/uploads/` **SÍ se incluyen** en la imagen
- ✅ El volumen permite persistencia y nuevos uploads
- ✅ Los backups son fáciles de hacer
- ✅ Todo está listo para producción
