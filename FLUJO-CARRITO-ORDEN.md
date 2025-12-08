# Flujo de Carrito y Orden con Redis

## Arquitectura
- **Backend**: Usa Redis para almacenar el carrito por `user_id` (extraído del JWT)
- **Frontend**: Solo envía comandos al backend, NO mantiene estado del carrito

## Flujo Completo

### 1️⃣ Agregar productos al carrito
```typescript
// Usuario agrega producto #1
await CartController.addItem({
  product_id: 1,
  quantity: 2
});

// Usuario agrega producto #3
await CartController.addItem({
  product_id: 3,
  quantity: 1
});
```

**Endpoint**: `POST /cart/add`
**Body**: `{ product_id: number, quantity: number }`
**Backend**: Guarda en Redis con key `cart:{user_id}`

---

### 2️⃣ Verificar carrito
```typescript
const cartResponse = await CartController.getCart();
console.log(cartResponse.data.items);
```

**Endpoint**: `GET /cart`
**Backend**: Lee desde Redis usando el `user_id` del JWT
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "redis_key",
    "user_id": "user123",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 2,
        "product": { ... }
      },
      {
        "id": 2,
        "product_id": 3,
        "quantity": 1,
        "product": { ... }
      }
    ],
    "total_items": 3,
    "total_amount": 599.00
  }
}
```

---

### 3️⃣ Crear la orden
```typescript
const order = await OrdersController.createOrder({
  address_id: 1,
  payment_method: 'mercadopago'
});
```

**Endpoint**: `POST /orders/` (con barra final)
**Body**: 
```json
{
  "address_id": 1,
  "payment_method": "mercadopago"
}
```

**Backend**:
1. Extrae `user_id` del JWT
2. Lee el carrito desde Redis: `cart:{user_id}`
3. Valida stock de cada producto
4. Crea la orden en la base de datos
5. Crea los `order_items` desde el carrito Redis
6. **NO borra el carrito** (se borra después del pago exitoso)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": "user123",
    "address_id": 1,
    "status": "pending",
    "payment_method": "mercadopago",
    "total": 599.00,
    "order_items": [
      {
        "product_id": 1,
        "quantity": 2,
        "unit_price": 199.50,
        "subtotal": 399.00
      },
      {
        "product_id": 3,
        "quantity": 1,
        "unit_price": 200.00,
        "subtotal": 200.00
      }
    ],
    "created_at": "2025-12-03T10:00:00"
  }
}
```

---

### 4️⃣ Crear el pago
```typescript
const payment = await OrdersController.createPayment(order.id);

// Redirigir a Mercado Pago
const isDevelopment = process.env.NODE_ENV === 'development';
const checkoutUrl = isDevelopment ? payment.sandbox_url : payment.checkout_url;

window.location.href = checkoutUrl;
```

**Endpoint**: `POST /payments/create/{order_id}`
**Backend**:
1. Busca la orden por `order_id`
2. Crea la preferencia en Mercado Pago
3. Retorna las URLs de checkout

**Response**:
```json
{
  "success": true,
  "data": {
    "checkout_url": "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=...",
    "sandbox_url": "https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=...",
    "payment_id": "123456789",
    "amount": 599.00,
    "currency": "MXN"
  }
}
```

---

### 5️⃣ Callbacks de Mercado Pago

Después del pago, Mercado Pago redirige a:

#### ✅ Pago Exitoso
- **URL**: `/checkout/success?payment_id=123&status=approved&external_reference=order_123`
- **Acción**: 
  - Mostrar confirmación
  - Limpiar `localStorage` (selected_address_id)
  - Backend actualiza orden a `paid`
  - Backend limpia carrito Redis

#### ❌ Pago Fallido
- **URL**: `/checkout/failure?payment_id=123&status=rejected`
- **Acción**: 
  - Mostrar razones de rechazo
  - Ofrecer reintentar o cambiar método

#### ⏳ Pago Pendiente
- **URL**: `/checkout/pending?payment_id=123&status=pending`
- **Acción**: 
  - Explicar que el pago está en proceso
  - Usuario recibirá email cuando se confirme

---

## Componentes Involucrados

### Frontend
- `lib/CartController.ts`: Maneja todas las operaciones del carrito
- `lib/OrdersController.ts`: Crea órdenes y pagos
- `components/orders/OrderSummary.tsx`: Muestra resumen y procesa pago
- `app/(shop)/checkout/success/page.tsx`: Página de éxito
- `app/(shop)/checkout/failure/page.tsx`: Página de fallo
- `app/(shop)/checkout/pending/page.tsx`: Página de pendiente

### Backend (FastAPI)
- `POST /cart/add`: Agregar al carrito Redis
- `GET /cart`: Obtener carrito Redis
- `POST /orders/`: Crear orden desde carrito Redis
- `POST /payments/create/{order_id}`: Crear preferencia MP

---

## Endpoints Correctos

```bash
# CARRITO
POST   /cart/add              # Agregar item
GET    /cart                  # Ver carrito
PUT    /cart/items/{product_id}  # Actualizar cantidad
DELETE /cart/items/{product_id}  # Eliminar item
DELETE /cart/clear            # Vaciar carrito

# ÓRDENES
POST   /orders/               # Crear orden (CON BARRA FINAL)
GET    /orders/               # Listar mis órdenes
GET    /orders/{order_id}     # Ver orden específica
POST   /orders/{order_id}/cancel  # Cancelar orden

# PAGOS
POST   /payments/create/{order_id}  # Crear pago MP
```

---

## Datos Importantes

### Redis Key Structure
```
cart:{user_id} = {
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "total": 599.00
}
```

### JWT Token
El backend extrae el `user_id` del JWT en cada request:
```python
from fastapi import Depends
from app.auth.jwt import get_current_user

@router.post("/orders/")
async def create_order(
    data: CreateOrderRequest,
    user = Depends(get_current_user)  # user_id viene del JWT
):
    # Backend lee: cart = redis.get(f"cart:{user.id}")
    pass
```

### Variables de Entorno
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxxxx  # Para futuras features

# Backend
REDIS_URL=redis://localhost:6379
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
FRONTEND_URL=http://localhost:3000
```

---

## Troubleshooting

### "Carrito vacío" al crear orden
**Causa**: El carrito Redis no tiene items o expiró
**Solución**: 
1. Verificar que `POST /cart/add` se está llamando
2. Verificar que el JWT es válido
3. Verificar TTL del carrito en Redis

### "Order not found" al crear pago
**Causa**: La orden no existe o pertenece a otro usuario
**Solución**:
1. Verificar que `order.id` es correcto
2. Verificar que el JWT es del mismo usuario

### Productos duplicados en la orden
**Causa**: Se está enviando `items` en el payload
**Solución**: ✅ Ya corregido - NO enviar items en CreateOrderRequest

---

## Implementación Actual

El código actual ya implementa correctamente este flujo:

✅ `CartController.addItem()` usa `POST /cart/add`
✅ `OrdersController.createOrder()` usa `POST /orders/` (con barra final)
✅ Payload solo envía `{ address_id, payment_method }`
✅ Backend lee carrito desde Redis automáticamente
✅ `OrderSummary.tsx` sigue el flujo completo: carrito → orden → pago → redirect
