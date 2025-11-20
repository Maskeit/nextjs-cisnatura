# Grupo (user) - Páginas de Usuario

Este grupo contiene todas las páginas relacionadas con la gestión del perfil y cuenta del usuario.

## Estructura

```
app/(user)/
├── layout.tsx                 # Layout compartido con Navbar y Footer
└── perfil/
    ├── page.tsx               # Página principal de perfil (con Suspense)
    ├── PerfilContent.tsx      # Contenido client component
    └── editar/
        ├── page.tsx           # Página de edición de perfil (con Suspense)
        └── EditarPerfilContent.tsx  # Formularios de edición
```

## Características

### Layout
- ✅ Navbar con SearchBar protegido por Suspense
- ✅ Footer
- ✅ ThemeProvider
- ✅ Toaster para notificaciones
- ✅ Metadata optimizada para SEO

### Página de Perfil (`/perfil`)
- ✅ **Autenticación requerida**: Redirige a `/login` si no está autenticado
- ✅ **Server Component** con Suspense boundary
- ✅ **Loading skeleton** mientras carga el contenido
- ✅ **Dashboard completo** del usuario con:
  - Información personal (nombre, email, verificación)
  - Estadísticas (órdenes, gastos, direcciones)
  - Última orden
  - Acciones rápidas

### Datos Mostrados
- Nombre completo
- Email con estado de verificación
- Fecha de registro
- Total de órdenes (completadas y pendientes)
- Total gastado
- Número de direcciones guardadas
- Última orden (ID, fecha, total, estado)

### Acciones Disponibles
- Ver/editar perfil
- Ver todas las órdenes
- Gestionar direcciones
- Cambiar contraseña
- Cerrar sesión

### Rutas Implementadas

#### `/perfil/editar` ✅
Página de edición de perfil con:
- **Información Personal**: Editar nombre completo (el email no se puede cambiar)
- **Cambiar Contraseña**: Formulario con contraseña actual, nueva y confirmación
- **Suspender Cuenta**: Opción peligrosa para desactivar la cuenta (requiere reactivación por admin)
- Validaciones completas en cada sección
- Manejo de errores específicos (INVALID_PASSWORD, PENDING_ORDERS, etc.)
- Diseño con AlertDialog para confirmación de acciones peligrosas
- Estados de carga individuales por sección

### Rutas Futuras

### Ya Planeadas
- `/mis-ordenes` - Lista de órdenes del usuario
- `/mis-ordenes/[id]` - Detalle de orden específica

### Posibles Expansiones
- `/perfil/preferencias` - Configuración de preferencias
- `/perfil/notificaciones` - Configurar notificaciones
- `/perfil/seguridad` - Configuración de seguridad (2FA, etc)
- `/favoritos` - Productos favoritos
- `/lista-deseos` - Lista de deseos

## Integración con API

Usa `UserController` para interactuar con la API:

```typescript
import UserController from '@/lib/UserController';

// Obtener resumen completo con estadísticas
const summary = await UserController.getMyProfileSummary();

// Obtener perfil básico
const profile = await UserController.getMyProfile();

// Actualizar perfil
await UserController.updateMyProfile({ full_name: "Nuevo Nombre" });

// Cambiar contraseña
await UserController.changePassword({
  current_password: "old",
  new_password: "new",
  confirm_password: "new"
});

// Suspender cuenta (soft delete)
await UserController.deleteMyAccount();
```

## Protección de Rutas

Todas las páginas en este grupo verifican autenticación:

```typescript
const { isAuthenticated, isLoading } = useAuth();

if (!isLoading && !isAuthenticated) {
  toast.info('Inicia sesión para ver tu perfil');
  router.push('/login');
}
```

## Manejo de Errores

- **401/AUTHENTICATION_REQUIRED**: Redirige a `/login`
- **Errores de red**: Muestra mensaje y botón de reintentar
- **Sesión expirada**: Limpia sesión y redirige a login

## Suspense Pattern

Todas las páginas que usan `useSearchParams` están envueltas en Suspense:

```typescript
// page.tsx (Server Component)
export default function PerfilPage() {
  return (
    <Suspense fallback={<PerfilFallback />}>
      <PerfilContent />
    </Suspense>
  );
}

// PerfilContent.tsx (Client Component)
"use client"
export default function PerfilContent() {
  // Lógica del componente
}
```

## Componentes UI Usados

- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button`
- Iconos de `lucide-react`
- Toast notifications con `sonner`

## Estado de Carga

Tres estados principales:
1. **Loading**: Muestra skeleton mientras autentica y carga datos
2. **Error**: Muestra mensaje de error con opción de reintentar
3. **Success**: Muestra el dashboard completo

## Navegación

El usuario puede navegar a:
- `/` - Home
- `/mis-ordenes` - Sus órdenes
- `/domicilio` - Gestionar direcciones
- `/perfil/editar` - Editar perfil
- `/perfil/cambiar-contrasena` - Cambiar contraseña
- Cerrar sesión (logout)
