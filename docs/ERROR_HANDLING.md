# Sistema de Manejo de Errores de Autenticación

## 📋 Estructura de Respuestas de Error

### Formato de la API
La API devuelve errores con la siguiente estructura:

```json
{
    "detail": {
        "success": false,
        "status_code": 401,
        "message": "Token de autenticación requerido",
        "error": "AUTHENTICATION_REQUIRED"
    }
}
```

## 🔧 Implementación en Next.js

### 1. **Interceptor de Axios** (`lib/api.ts`)

Se agregó un interceptor que automáticamente extrae el contenido de `detail`:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponseWrapper>) => {
    // Si la respuesta tiene { detail: { ... } }, extraer el detail
    if (error.response?.data?.detail) {
      error.response.data = error.response.data.detail as any;
    }
    return Promise.reject(error);
  }
);
```

**Beneficio:** Los componentes reciben directamente la estructura de error sin el wrapper `detail`.

### 2. **Interfaces de Error Actualizadas**

#### User.ts
```typescript
export interface BaseErrorResponse {
    success: false;
    status_code: number;
    message: string;
    error: string;
}

export interface AuthErrorResponse extends BaseErrorResponse {
    error: "AUTHENTICATION_REQUIRED" | "UNAUTHORIZED" | "FORBIDDEN" | ...;
}

// Estructura completa con wrapper (como viene de la API)
export interface ApiErrorResponseWrapper {
    detail: ValidationErrorResponse | AuthErrorResponse | BaseErrorResponse;
}
```

#### Cart.ts, Address.ts, Orders.ts, Products.ts
Todas las interfaces de error fueron actualizadas para incluir:
- `AUTHENTICATION_REQUIRED` en los tipos de error
- Interfaz wrapper `*ApiErrorWrapper` con `detail`

### 3. **Códigos de Error Soportados**

#### Autenticación (`User.ts`)
- `AUTHENTICATION_REQUIRED` - No hay token
- `UNAUTHORIZED` - Token inválido
- `FORBIDDEN` - Sin permisos
- `TOKEN_EXPIRED` - Token expirado
- `TOKEN_REVOKED` - Token revocado
- `INVALID_CREDENTIALS` - Credenciales incorrectas

#### Cart (`Cart.ts`)
- `AUTHENTICATION_REQUIRED`
- `CART_NOT_FOUND`
- `ITEM_NOT_FOUND`
- `PRODUCT_NOT_FOUND`
- `INSUFFICIENT_STOCK`
- `INVALID_QUANTITY`
- `VALIDATION_ERROR`

#### Address (`Address.ts`)
- `AUTHENTICATION_REQUIRED`
- `ADDRESS_NOT_FOUND`
- `MAX_ADDRESSES_REACHED`
- `VALIDATION_ERROR`

#### Orders (`Orders.ts`)
- `AUTHENTICATION_REQUIRED`
- `ORDER_NOT_FOUND`
- `EMPTY_CART`
- `ADDRESS_NOT_FOUND`
- `PRODUCT_NOT_FOUND`
- `INSUFFICIENT_STOCK`
- `CANNOT_CANCEL_ORDER`
- `FORBIDDEN`
- `VALIDATION_ERROR`

#### Products (`Products.ts`)
- `AUTHENTICATION_REQUIRED`
- `FORBIDDEN`
- `PRODUCT_NOT_FOUND`
- `CATEGORY_NOT_FOUND`
- `DUPLICATE_SLUG`
- `TOKEN_EXPIRED`
- `TOKEN_REVOKED`
- `VALIDATION_ERROR`

## 🎯 Manejo de Errores en Componentes

### Patrón Recomendado

```typescript
try {
  const response = await someAPI.method();
  // Procesar respuesta exitosa
} catch (error: any) {
  // El interceptor ya extrajo el detail
  if (error.response?.status === 401 || 
      error.response?.data?.error === 'AUTHENTICATION_REQUIRED') {
    // Manejar falta de autenticación
    toast.info('Inicia sesión para continuar');
    router.push('/login');
  } else if (error.response?.data?.message) {
    // Mostrar mensaje de error de la API
    toast.error(error.response.data.message);
  } else {
    // Mensaje genérico
    toast.error('Ocurrió un error');
  }
}
```

### Ejemplos Implementados

#### ProductCard.tsx
```typescript
if (error.response?.status === 401 || 
    error.response?.data?.error === 'AUTHENTICATION_REQUIRED') {
  toast.info('Inicia sesión para agregar productos a tu carrito', {
    action: {
      label: 'Iniciar sesión',
      onClick: () => router.push('/login')
    },
  });
  setTimeout(() => router.push('/login'), 2000);
}
```

#### Navbar.tsx
```typescript
// Manejo silencioso (sin toasts para evitar spam)
if (error.response?.status === 401 || 
    error.response?.data?.error === 'AUTHENTICATION_REQUIRED') {
  setCartItemCount(0);
}
```

#### login/page.tsx y register/page.tsx
```typescript
// El interceptor ya extrajo el detail
if (err.response?.data?.message) {
  errorMessage = err.response.data.message;
} else if (err.response?.status === 401) {
  errorMessage = 'Credenciales incorrectas';
}
```

## ✅ Ventajas del Sistema

1. **Consistencia**: Todos los errores siguen el mismo formato
2. **Type Safety**: TypeScript valida los tipos de error
3. **Transparencia**: El interceptor hace el unwrap automáticamente
4. **Flexibilidad**: Se puede verificar tanto el status code como el error code
5. **Mantenibilidad**: Fácil agregar nuevos códigos de error

## 🔒 Seguridad

- Los tokens se manejan en cookies httpOnly (via cookieStorage)
- El interceptor no expone información sensible
- Los mensajes de error son claros pero no revelan detalles de seguridad
- Redirección automática a login en errores de autenticación

## 📝 Testing

### Verificar errores de autenticación:
1. Hacer logout
2. Intentar agregar producto al carrito
3. Debería mostrar toast informativo y redirigir a login

### Verificar errores de validación:
1. Intentar crear orden sin productos en carrito
2. Debería mostrar mensaje específico del backend

### Verificar manejo de errores de red:
1. Desconectar internet
2. Intentar hacer una operación
3. Debería mostrar "Error de conexión"
