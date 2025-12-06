# Resumen de Integración Stripe

## ✅ Archivos Creados/Modificados

### 1. **Interfaces y Tipos** (`interfaces/Payment.ts`)
- `CreateCheckoutSessionResponse`: Respuesta del backend
- `CreateStripeCheckoutRequest`: Payload para crear sesión
- `StripePaymentInfo`: Info de pago completado
- `PaymentProvider`: 'stripe' | 'mercadopago'

### 2. **Controller** (`lib/PaymentController.ts`)
- `createStripeCheckoutSession()`: Crea sesión de checkout
- `getStripeSession()`: Obtiene info de sesión
- `getAvailablePaymentMethods()`: Lista métodos disponibles

### 3. **Componentes**
- `components/payments/StripeCheckoutForm.tsx`: Checkout embebido
- `components/orders/OrderSummary.tsx`: Actualizado con selector de método

### 4. **Páginas de Callback**
- `app/(shop)/checkout/stripe/success/page.tsx`: Pago exitoso
- `app/(shop)/checkout/stripe/cancel/page.tsx`: Pago cancelado

### 5. **Documentación**
- `STRIPE-BACKEND-GUIDE.md`: Guía completa para implementar backend

### 6. **Configuración**
- `.env`: Actualizado con comentarios claros

---

## 🎯 Flujo Completo

```
1. Usuario en OrderSummary
   ↓
2. Selecciona "Stripe" como método de pago
   ↓
3. Click en "Proceder al pago"
   ↓
4. Se muestra StripeCheckoutForm (embebido)
   ↓
5. Frontend llama: POST /payments/stripe/create-checkout-session
   {
     address_id: 1,
     payment_method: "stripe",
     shipping_cost: 140.00
   }
   ↓
6. Backend:
   - Lee carrito de Redis
   - Valida stock y dirección
   - Crea line_items (productos + envío)
   - Crea Stripe Checkout Session
   - Retorna client_secret
   ↓
7. Stripe renderiza el checkout embebido
   ↓
8. Usuario completa el pago
   ↓
9. Stripe llama al webhook: POST /payments/stripe/webhook
   ↓
10. Webhook backend:
    - Verifica firma
    - Obtiene metadata (user_id, address_id, cart_snapshot)
    - Crea orden en PostgreSQL
    - Crea order_items
    - Reduce stock
    - Limpia carrito Redis
    ↓
11. Stripe redirige a: /checkout/stripe/success?session_id=xxx
    ↓
12. Frontend muestra página de éxito
```

---

## 📋 Endpoints del Backend que necesitas implementar

### 1. POST `/payments/stripe/create-checkout-session`
**Request:**
```json
{
  "address_id": 1,
  "payment_method": "stripe",
  "shipping_cost": 140.00,
  "notes": "Opcional"
}
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "message": "Checkout session creada",
  "data": {
    "session_id": "cs_test_xxx",
    "client_secret": "cs_test_xxx_secret_xxx",
    "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
  }
}
```

**Debe:**
- Leer carrito de Redis por `user_id`
- Validar stock de cada producto
- Crear line_items:
  ```python
  [
    {
      "price_data": {
        "currency": "mxn",
        "unit_amount": 19950,  # Centavos
        "product_data": {
          "name": "Producto",
          "images": ["url"]
        }
      },
      "quantity": 2
    },
    # Envío (si no es gratis)
    {
      "price_data": {
        "currency": "mxn",
        "unit_amount": 14000,
        "product_data": {"name": "Envío"}
      },
      "quantity": 1
    }
  ]
  ```
- Crear session con:
  ```python
  stripe.checkout.Session.create(
    line_items=line_items,
    mode="payment",
    ui_mode="embedded",
    success_url=f"{FRONTEND_URL}/checkout/stripe/success?session_id={{CHECKOUT_SESSION_ID}}",
    cancel_url=f"{FRONTEND_URL}/checkout/stripe/cancel?session_id={{CHECKOUT_SESSION_ID}}",
    return_url=f"{FRONTEND_URL}/checkout/stripe/success?session_id={{CHECKOUT_SESSION_ID}}",
    metadata={
      "user_id": user.id,
      "address_id": address_id,
      "cart_snapshot": json.dumps(cart_items)
    }
  )
  ```

### 2. POST `/payments/stripe/webhook`
**Headers:**
- `stripe-signature`: Firma del webhook

**Body:** Evento de Stripe

**Debe:**
- Verificar firma con `STRIPE_WEBHOOK_SECRET`
- Escuchar evento `checkout.session.completed`
- Extraer metadata:
  - `user_id`
  - `address_id`
  - `cart_snapshot`
- Verificar que no exista orden con ese `payment_id`
- Crear orden en PostgreSQL
- Crear order_items desde `cart_snapshot`
- Reducir stock
- Limpiar carrito Redis

### 3. GET `/payments/stripe/session/{session_id}` (Opcional)
**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "cs_test_xxx",
    "payment_intent": "pi_xxx",
    "payment_status": "paid",
    "amount_total": 76400,
    "currency": "mxn"
  }
}
```

---

## 🔧 Variables de Entorno Necesarias

### Backend (Python)
```python
STRIPE_SECRET_KEY="sk_test_51Sb5p3BhheIkdmWI..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # De Stripe CLI o Dashboard
FRONTEND_URL="http://localhost:3000"
```

### Frontend (Ya configurado)
```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_51Sb5p3BhheIkdmWI..."
```

---

## 🧪 Testing

### 1. Instalar Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:8000/payments/stripe/webhook
```

### 2. Tarjetas de Prueba
- **Éxito**: 4242 4242 4242 4242
- **Rechazo**: 4000 0000 0000 0002
- CVV: 123
- Fecha: 12/25

### 3. Flujo de Prueba
1. Agrega productos al carrito
2. Ve a checkout/resumen
3. Selecciona Stripe
4. Click "Proceder al pago"
5. Completa el formulario con tarjeta de prueba
6. Verifica que redirige a /checkout/stripe/success
7. Verifica en tu DB que se creó la orden
8. Verifica que se redujo el stock
9. Verifica que se limpió el carrito Redis

---

## 📖 Documentación Completa

Lee `STRIPE-BACKEND-GUIDE.md` para:
- Código completo de Python/FastAPI
- Ejemplos de line_items
- Manejo de webhooks
- Testing con Stripe CLI
- Solución de problemas comunes

---

## 🚨 Importante

1. **Webhook Secret**: Obténlo del Stripe Dashboard o CLI
2. **Prices en centavos**: Stripe usa centavos (multiply by 100)
3. **ui_mode="embedded"**: Para checkout embebido
4. **Validar stock**: SIEMPRE antes de crear session
5. **Prevenir duplicados**: Verificar `payment_id` en webhook
6. **Limpiar carrito**: Solo en webhook después de crear orden
