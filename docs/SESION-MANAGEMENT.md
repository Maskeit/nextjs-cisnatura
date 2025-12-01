# Sistema de Gestión de Sesiones

## Resumen

Este documento describe el sistema robusto de gestión de sesiones implementado para manejar automáticamente tokens inválidos, sesiones expiradas y limpieza completa de datos de usuario.

## Características Principales

### 1. Detección Automática de Sesiones Inválidas

**Interceptor de Axios** (`lib/api.ts`):
- Detecta automáticamente respuestas 401 (No Autorizado)
- Excluye endpoints de autenticación para evitar falsos positivos
- Cierra sesión automáticamente cuando detecta token inválido o expirado
- Redirige al usuario al login con la URL actual como parámetro `redirect`

```typescript
// El interceptor detecta errores 401 automáticamente
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !isAuthEndpoint) {
      handleSessionExpired(); // Limpia y redirige
    }
    return Promise.reject(error);
  }
);
```

### 2. Limpieza Completa de Sesión

**Utilidades de Sesión** (`lib/session.ts`):

#### `clearSession()`
Limpia completamente la sesión del usuario:
- ✅ Elimina cookies de autenticación (access_token, refresh_token, user_data)
- ✅ Elimina header de Authorization de axios
- ✅ Limpia localStorage (selected_address_id, last_order_id)

#### `isSessionValid()`
Valida que la sesión sea completa:
- Verifica que exista el token
- Verifica que existan los datos de usuario
- Retorna `false` si falta cualquiera de los dos

#### `redirectToLogin()`
Redirige al login limpiando todo:
- Ejecuta `clearSession()`
- Guarda la ruta actual para redirect
- Agrega parámetros de query según la razón (expired/invalid)

#### `initializeSession()`
Inicializa la sesión al cargar la app:
- Valida que la sesión sea completa
- Configura el token en axios si es válido
- Limpia todo si la sesión está corrupta

### 3. Middleware Mejorado

**Proxy Middleware** (`proxy.ts`):

#### Validación Robusta
```typescript
// Valida que existan AMBOS: token y user_data
const isAuthenticated = !!token && !!userDataCookie;

// Si tiene token pero no user_data, sesión corrupta
if (token && !userDataCookie) {
  return handleUnauthenticated(request, pathname);
}
```

#### Limpieza de Cookies Corruptas
```typescript
function handleUnauthenticated(request, pathname) {
  const response = NextResponse.redirect(loginUrl);
  
  // Limpia cookies inválidas del lado del servidor
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  response.cookies.delete('user_data');
  
  return response;
}
```

### 4. Provider de Sesión

**SessionProvider** (`components/SessionProvider.tsx`):
- Componente que envuelve la aplicación
- Inicializa automáticamente la sesión al cargar
- Configura axios con el token si existe sesión válida

Implementado en todos los layouts:
- `app/(shop)/layout.tsx` - Tienda
- `app/(user)/layout.tsx` - Perfil de usuario
- `app/(auth)/layout.tsx` - Autenticación

### 5. Mensajes al Usuario

**Login Page** (`app/(auth)/login/page.tsx`):
- Detecta parámetro `session_expired=true`
- Muestra toast: "Tu sesión ha expirado. Por favor inicia sesión nuevamente."
- Preserva la ruta de redirect para después del login

## Flujo Completo

### Escenario 1: Token Expira Durante Navegación

1. Usuario hace una petición a la API
2. Backend responde con 401 (token expirado)
3. Interceptor de axios detecta el 401
4. Se ejecuta `handleSessionExpired()`:
   - Limpia todas las cookies
   - Limpia localStorage
   - Elimina header de Authorization
   - Redirige a `/login?redirect=/ruta-actual&session_expired=true`
5. Usuario ve mensaje de sesión expirada
6. Después de login, es redirigido a la ruta original

### Escenario 2: Sesión Corrupta (solo token sin user_data)

1. Usuario intenta acceder a ruta protegida
2. Middleware detecta token pero no user_data
3. Se ejecuta `handleUnauthenticated()`:
   - Limpia cookies del lado del servidor
   - Redirige a `/login?redirect=/ruta-solicitada`
4. Usuario inicia sesión
5. Es redirigido a la ruta que intentó acceder

### Escenario 3: Usuario Cierra Sesión Manualmente

1. Usuario hace clic en "Cerrar sesión"
2. Se ejecuta `AuthAPI.logoutAndClear()`:
   - Llama al endpoint `/auth/logout` en backend
   - Ejecuta `clearSession()` en cliente
   - Limpia cookies, localStorage, axios headers
3. Usuario es redirigido al home o login

## Archivos Modificados/Creados

### Archivos Creados
- ✅ `lib/session.ts` - Utilidades de gestión de sesión
- ✅ `components/SessionProvider.tsx` - Provider de inicialización

### Archivos Modificados
- ✅ `lib/api.ts` - Interceptor de 401
- ✅ `lib/Auth.ts` - Limpieza de localStorage en logout
- ✅ `proxy.ts` - Validación robusta de sesión
- ✅ `app/(auth)/login/page.tsx` - Mensaje de sesión expirada
- ✅ `app/(shop)/layout.tsx` - SessionProvider
- ✅ `app/(user)/layout.tsx` - SessionProvider
- ✅ `app/(auth)/layout.tsx` - SessionProvider

## Ventajas del Sistema

1. **Automático**: No requiere código adicional en componentes
2. **Robusto**: Maneja múltiples casos (expiración, corrupción, eliminación manual)
3. **UX Amigable**: Mensajes claros y redirect a la ruta original
4. **Seguro**: Limpia TODOS los datos sensibles
5. **Previene Loops**: Variable `isRedirecting` evita múltiples redirects
6. **Server & Client**: Validación en ambos lados

## Uso en Componentes

### Verificar Sesión
```typescript
import { isSessionValid } from '@/lib/session';

if (!isSessionValid()) {
  // Sesión inválida
}
```

### Limpiar Sesión Manualmente
```typescript
import { clearSession } from '@/lib/session';

clearSession(); // Limpia todo
```

### Redirigir a Login
```typescript
import { redirectToLogin } from '@/lib/session';

redirectToLogin('/checkout', 'expired'); // Con razón específica
```

### Cerrar Sesión Completa
```typescript
import { AuthAPI } from '@/lib/Auth';

await AuthAPI.logoutAndClear(); // Backend + frontend
```

## Testing

Para probar el sistema:

1. **Expiración de Token**:
   - Modificar token en cookies del navegador
   - Hacer cualquier petición a la API
   - Debe limpiar y redirigir automáticamente

2. **Sesión Corrupta**:
   - Eliminar solo `user_data` de cookies
   - Intentar acceder a ruta protegida
   - Middleware debe limpiar y redirigir

3. **Logout Manual**:
   - Cerrar sesión desde navbar
   - Verificar que se limpien cookies y localStorage
   - Verificar redirect

## Rutas Protegidas

El middleware protege automáticamente:
- `/carrito`
- `/domicilio`
- `/checkout/*`
- `/perfil`
- `/mis-pedidos`
- `/admin/*` (requiere además `is_admin = true`)

## Configuración

No requiere configuración adicional. El sistema funciona automáticamente al:
1. Incluir `SessionProvider` en layouts (✅ ya implementado)
2. Usar `api` de axios para peticiones (✅ ya implementado)
3. Tener rutas protegidas en `proxy.ts` (✅ ya implementado)

## Mantenimiento

### Agregar Nueva Ruta Protegida
Editar `proxy.ts`:
```typescript
const protectedRoutes = [
  '/carrito',
  '/domicilio',
  '/tu-nueva-ruta', // ← Agregar aquí
];
```

### Agregar Datos a Limpiar en Logout
Editar `lib/session.ts` en `clearSession()`:
```typescript
localStorage.removeItem('tu_nuevo_dato');
```

### Excluir Endpoint del Interceptor 401
Editar `lib/api.ts`:
```typescript
const isAuthEndpoint = 
  error.config?.url?.includes('/auth/login') ||
  error.config?.url?.includes('/tu-nuevo-endpoint');
```
