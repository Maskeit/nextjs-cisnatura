# PM2 Production Deployment Guide

## Configuración de PM2

Este proyecto está configurado para desplegarse en producción usando PM2 como gestor de procesos.

## Requisitos previos

```bash
npm install -g pm2
```

## Scripts disponibles

### Desarrollo
```bash
npm run dev          # Inicia el servidor de desarrollo
npm run build        # Construye la aplicación para producción
```

### Producción con PM2

```bash
npm run pm2:start    # Inicia la aplicación con PM2
npm run pm2:stop     # Detiene la aplicación
npm run pm2:restart  # Reinicia la aplicación
npm run pm2:delete   # Elimina la aplicación de PM2
npm run pm2:logs     # Ver logs en tiempo real
npm run pm2:monit    # Monitor interactivo de PM2
npm run deploy       # Build + restart con actualización de variables de entorno
```

## Flujo de despliegue

### Primera vez

1. **Build de la aplicación:**
   ```bash
   npm run build
   ```

2. **Iniciar con PM2:**
   ```bash
   npm run pm2:start
   ```

3. **Guardar configuración PM2:**
   ```bash
   pm2 save
   pm2 startup
   ```
   Ejecuta el comando que PM2 te sugiera para auto-iniciar en boot.

### Actualizaciones posteriores

```bash
npm run deploy
```

Este comando hace:
1. `npm run build` - Construye la nueva versión
2. `pm2 restart` - Reinicia con la nueva versión y actualiza variables de entorno

## Monitoreo

### Ver estado de la aplicación
```bash
pm2 status
```

### Ver logs
```bash
npm run pm2:logs     # Logs en tiempo real
pm2 logs --lines 100 # Últimas 100 líneas
```

Los logs también se guardan en:
- `/logs/pm2-error.log` - Errores
- `/logs/pm2-out.log` - Output estándar
- `/logs/pm2-combined.log` - Combinados

### Monitor en tiempo real
```bash
npm run pm2:monit
```

## Configuración del servidor

### Puerto
La aplicación corre en el puerto **3000** por defecto.

### Variables de entorno
Asegúrate de tener un archivo `.env` en la raíz del proyecto con:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://tu-api.com
# ... otras variables
```

### Recursos
- **Instancias:** 1 en modo cluster
- **Memoria máxima:** 1GB (reinicia automáticamente si se excede)
- **Reinicios automáticos:** Sí
- **Reinicios máximos:** 10
- **Tiempo mínimo uptime:** 10 segundos

## Comandos útiles de PM2

```bash
# Ver todas las aplicaciones
pm2 list

# Información detallada
pm2 show nextjs-cisnatura

# Reiniciar con 0 downtime
pm2 reload nextjs-cisnatura

# Escalar a múltiples instancias (ej: 4 CPUs)
pm2 scale nextjs-cisnatura 4

# Limpiar logs
pm2 flush

# Detener todo
pm2 stop all

# Eliminar todo
pm2 delete all
```

## Troubleshooting

### La aplicación no inicia
```bash
# Ver logs de error
pm2 logs nextjs-cisnatura --err

# Verificar que el build existe
ls -la .next

# Reconstruir
npm run build
```

### Memoria alta
```bash
# Ver uso de memoria
pm2 monit

# Ajustar límite en ecosystem.config.js
# max_memory_restart: '2G'
```

### Puerto ocupado
```bash
# Verificar qué usa el puerto 3000
lsof -i :3000

# Cambiar puerto en ecosystem.config.js si es necesario
```

## Nginx (Opcional)

Si usas Nginx como proxy reverso:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Seguridad

- Asegúrate de que `.env` **no** esté en el repositorio
- Los logs están excluidos del git (`.gitignore`)
- Usa HTTPS en producción
- Mantén PM2 actualizado: `pm2 update`
