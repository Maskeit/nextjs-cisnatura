# Guía de Integración Stripe Backend (Python/FastAPI)

## 📋 Resumen de la Integración Frontend

Ya está implementado en el frontend:
- ✅ Interfaces de pago (`interfaces/Payment.ts`)
- ✅ PaymentController con método `createStripeCheckoutSession()`
- ✅ Componente `StripeCheckoutForm` (checkout embebido)
- ✅ OrderSummary actualizado con selector de método de pago
- ✅ Páginas de callback (`/checkout/stripe/success` y `/checkout/stripe/cancel`)

## 🔑 1. Claves de Stripe

### Variables de Entorno Backend
```python
# .env del backend (Python/FastAPI)
STRIPE_SECRET_KEY="sk_test_51Sb5p3BhheIkdmWI..."  # ⚠️ PRIVADO - Secret Key
STRIPE_WEBHOOK_SECRET="whsec_..."  # Para validar webhooks
FRONTEND_URL="http://localhost:3000"  # Para redirect URLs
```

### Variables de Entorno Frontend (Ya configuradas)
```env
# .env.local del frontend (Next.js)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_51Sb5p3BhheIkdmWI..."  # ✅ Público
```

## 📦 2. Instalación Backend

```bash
pip install stripe python-dotenv
```

## 🚀 3. Endpoint: Crear Checkout Session

### Request del Frontend
```typescript
POST /payments/stripe/create-checkout-session
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "address_id": 1,
  "payment_method": "stripe",
  "shipping_cost": 140.00,
  "notes": "Opcional"
}
```

### Implementación Backend (Python/FastAPI)

```python
import stripe
import json
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

# Configurar Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

router = APIRouter(prefix="/payments/stripe", tags=["payments"])

# ==================== SCHEMAS ====================

class CreateCheckoutSessionRequest(BaseModel):
    address_id: int
    payment_method: str = "stripe"
    shipping_cost: Optional[float] = 0.0
    notes: Optional[str] = None

class CheckoutSessionResponse(BaseModel):
    session_id: str
    client_secret: str
    url: Optional[str] = None

# ==================== ENDPOINT ====================

@router.post("/create-checkout-session", response_model=dict)
async def create_checkout_session(
    data: CreateCheckoutSessionRequest,
    user = Depends(get_current_user),  # Tu dependency de autenticación
    db: Session = Depends(get_db)
):
    """
    Crea una Stripe Checkout Session desde el carrito Redis
    
    Flujo:
    1. Lee carrito de Redis por user_id
    2. Valida stock y dirección
    3. Crea line_items para Stripe (productos + envío)
    4. Crea Checkout Session con metadata
    5. NO crea orden todavía (se crea en webhook)
    6. Retorna client_secret para el checkout embebido
    """
    
    try:
        # 1️⃣ Obtener carrito de Redis
        cart_key = f"cart:{user.id}"
        cart_data = redis_client.get(cart_key)
        
        if not cart_data:
            raise HTTPException(status_code=400, detail="Carrito vacío")
        
        cart = json.loads(cart_data)
        
        if not cart.get("items"):
            raise HTTPException(status_code=400, detail="Carrito sin items")
        
        # 2️⃣ Validar dirección
        address = db.query(Address).filter(
            Address.id == data.address_id,
            Address.user_id == user.id,
            Address.is_active == True
        ).first()
        
        if not address:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")
        
        # 3️⃣ Construir line_items para Stripe
        line_items = []
        subtotal = 0.0
        cart_snapshot = []
        
        for cart_item in cart["items"]:
            product = db.query(Product).filter(Product.id == cart_item["product_id"]).first()
            
            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Producto {cart_item['product_id']} no encontrado"
                )
            
            if product.stock < cart_item["quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente para {product.name}"
                )
            
            # Precio en centavos (Stripe usa centavos)
            unit_price_cents = int(float(product.price) * 100)
            quantity = cart_item["quantity"]
            
            line_items.append({
                "price_data": {
                    "currency": "mxn",
                    "unit_amount": unit_price_cents,
                    "product_data": {
                        "name": product.name,
                        "description": product.description[:500] if product.description else "",
                        "images": [
                            f"{FRONTEND_URL}{product.image_url}"
                        ] if product.image_url else [],
                    },
                },
                "quantity": quantity,
            })
            
            subtotal += float(product.price) * quantity
            
            # Guardar snapshot del carrito
            cart_snapshot.append({
                "product_id": product.id,
                "product_name": product.name,
                "quantity": quantity,
                "unit_price": float(product.price)
            })
        
        # 4️⃣ Agregar envío como line_item (si no es gratis)
        shipping_cost = float(data.shipping_cost or 0)
        if shipping_cost > 0:
            line_items.append({
                "price_data": {
                    "currency": "mxn",
                    "unit_amount": int(shipping_cost * 100),  # Centavos
                    "product_data": {
                        "name": "Costo de envío",
                        "description": "Envío a domicilio",
                    },
                },
                "quantity": 1,
            })
        
        total_amount = subtotal + shipping_cost
        
        # 5️⃣ Crear Checkout Session
        checkout_session = stripe.checkout.Session.create(
            # Line items (productos + envío)
            line_items=line_items,
            
            # Modo de pago
            mode="payment",
            
            # URLs de redirección
            success_url=f"{FRONTEND_URL}/checkout/stripe/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/checkout/stripe/cancel?session_id={{CHECKOUT_SESSION_ID}}",
            
            # Configuración de UI
            ui_mode="embedded",  # ✅ Para checkout embebido
            return_url=f"{FRONTEND_URL}/checkout/stripe/success?session_id={{CHECKOUT_SESSION_ID}}",
            
            # Metadata (importante para el webhook)
            metadata={
                "user_id": str(user.id),
                "address_id": str(data.address_id),
                "subtotal": str(subtotal),
                "shipping_cost": str(shipping_cost),
                "total": str(total_amount),
                "cart_snapshot": json.dumps(cart_snapshot),
                "notes": data.notes or ""
            },
            
            # Información del cliente
            customer_email=user.email,
            
            # Configuración adicional
            payment_intent_data={
                "metadata": {
                    "user_id": str(user.id),
                    "address_id": str(data.address_id)
                }
            },
            
            # Habilitar dirección de envío (opcional)
            # shipping_address_collection={
            #     "allowed_countries": ["MX"],
            # },
        )
        
        # 6️⃣ Retornar respuesta
        return {
            "success": True,
            "status_code": 200,
            "message": "Checkout session creada",
            "data": {
                "session_id": checkout_session.id,
                "client_secret": checkout_session.client_secret,
                "url": checkout_session.url  # Para redirect (si no usas embebido)
            }
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Error de Stripe: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
```

---

## 🎣 4. Webhook: Confirmar Pago y Crear Orden

### Configurar Webhook en Stripe Dashboard

1. Ve a: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://tu-backend.com/payments/stripe/webhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### Implementación del Webhook

```python
from fastapi import Request, Header
from typing import Optional

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Webhook de Stripe para confirmar pagos
    
    Cuando el pago es exitoso:
    1. Verifica la firma del webhook
    2. Lee el evento de Stripe
    3. Si es checkout.session.completed:
       - Obtiene metadata (user_id, address_id, cart_snapshot)
       - Crea la orden en PostgreSQL
       - Crea order_items
       - Reduce stock
       - Limpia carrito Redis
       - Envía email de confirmación
    """
    
    payload = await request.body()
    
    try:
        # 1️⃣ Verificar firma del webhook
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # 2️⃣ Manejar el evento
    event_type = event['type']
    
    if event_type == 'checkout.session.completed':
        session = event['data']['object']
        
        # Extraer metadata
        metadata = session.get('metadata', {})
        user_id = metadata.get('user_id')
        address_id = int(metadata.get('address_id'))
        subtotal = float(metadata.get('subtotal', 0))
        shipping_cost = float(metadata.get('shipping_cost', 0))
        total = float(metadata.get('total', 0))
        cart_snapshot = json.loads(metadata.get('cart_snapshot', '[]'))
        notes = metadata.get('notes', '')
        
        # IDs de pago
        payment_intent_id = session.get('payment_intent')
        session_id = session['id']
        
        # 3️⃣ Verificar que no exista orden con este payment_intent
        existing_order = db.query(Order).filter(
            Order.payment_id == payment_intent_id
        ).first()
        
        if existing_order:
            return {"status": "order_already_exists", "order_id": existing_order.id}
        
        # 4️⃣ Crear la orden
        order = Order(
            user_id=user_id,
            address_id=address_id,
            payment_method="stripe",
            payment_id=payment_intent_id,
            payment_status="paid",
            status="paid",
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax=0.0,
            total=total,
            notes=notes
        )
        db.add(order)
        db.flush()  # Para obtener order.id
        
        # 5️⃣ Crear order_items y reducir stock
        for item in cart_snapshot:
            product = db.query(Product).filter(
                Product.id == item["product_id"]
            ).first()
            
            if product:
                # Crear order_item
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=item["product_name"],
                    product_sku=product.sku,
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    subtotal=item["unit_price"] * item["quantity"]
                )
                db.add(order_item)
                
                # Reducir stock
                product.stock -= item["quantity"]
        
        db.commit()
        
        # 6️⃣ Limpiar carrito de Redis
        cart_key = f"cart:{user_id}"
        redis_client.delete(cart_key)
        
        # 7️⃣ Enviar email de confirmación (opcional)
        # send_order_confirmation_email(order)
        
        return {
            "status": "success",
            "order_id": order.id,
            "payment_id": payment_intent_id
        }
    
    elif event_type == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        print(f"Payment Intent succeeded: {payment_intent['id']}")
    
    elif event_type == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        print(f"Payment Intent failed: {payment_intent['id']}")
    
    return {"status": "success"}
```

---

## 🔍 5. Endpoint: Obtener Info de Sesión (Opcional)

```python
@router.get("/session/{session_id}")
async def get_stripe_session(
    session_id: str,
    user = Depends(get_current_user)
):
    """
    Obtiene información de una sesión de Stripe
    Útil para la página de success
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        return {
            "success": True,
            "data": {
                "session_id": session.id,
                "payment_intent": session.payment_intent,
                "payment_status": session.payment_status,
                "amount_total": session.amount_total,
                "currency": session.currency,
                "customer_email": session.customer_details.get("email") if session.customer_details else None
            }
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 🧪 6. Tarjetas de Prueba Stripe

| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| **Visa aprobada** | 4242 4242 4242 4242 | ✅ Éxito |
| **Mastercard aprobada** | 5555 5555 5555 4444 | ✅ Éxito |
| **American Express** | 3782 822463 10005 | ✅ Éxito |
| **Rechazada** | 4000 0000 0000 0002 | ❌ Rechazada |
| **Requiere autenticación** | 4000 0025 0000 3155 | 🔐 3D Secure |

**Datos adicionales para pruebas:**
- CVV: Cualquier 3 dígitos (ej: 123)
- Fecha: Cualquier fecha futura (ej: 12/25)
- ZIP: Cualquier código postal (ej: 12345)

---

## 📊 7. Estructura de Datos

### Metadata en Checkout Session
```python
{
    "user_id": "user123",
    "address_id": "1",
    "subtotal": "624.00",
    "shipping_cost": "140.00",
    "total": "764.00",
    "cart_snapshot": '[{"product_id":1,"quantity":2,"unit_price":199.50}]',
    "notes": "Entregar por la mañana"
}
```

### Line Items Ejemplo
```python
[
    {
        "price_data": {
            "currency": "mxn",
            "unit_amount": 19950,  # $199.50 en centavos
            "product_data": {
                "name": "Shampoo Orgánico",
                "description": "Shampoo natural con ingredientes orgánicos",
                "images": ["http://localhost:3000/products/shampoo.jpg"]
            }
        },
        "quantity": 2
    },
    {
        "price_data": {
            "currency": "mxn",
            "unit_amount": 14000,  # $140.00 envío
            "product_data": {
                "name": "Costo de envío",
                "description": "Envío a domicilio"
            }
        },
        "quantity": 1
    }
]
```

---

## 🚀 8. Testing Local con Webhook

### Opción 1: Stripe CLI (Recomendado)
```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to localhost:8000/payments/stripe/webhook

# Obtendrás un webhook secret temporal: whsec_xxxxx
# Agrégalo a tu .env como STRIPE_WEBHOOK_SECRET
```

### Opción 2: ngrok
```bash
ngrok http 8000
# Usa la URL de ngrok en el dashboard de Stripe
```

---

## ✅ 9. Checklist de Implementación

### Backend:
- [ ] Instalar `stripe` package
- [ ] Configurar `STRIPE_SECRET_KEY` en .env
- [ ] Implementar endpoint `POST /payments/stripe/create-checkout-session`
- [ ] Implementar webhook `POST /payments/stripe/webhook`
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Probar con Stripe CLI o ngrok
- [ ] Verificar que se crean órdenes correctamente
- [ ] Verificar que se reduce el stock
- [ ] Verificar que se limpia el carrito Redis

### Testing:
- [ ] Probar checkout embebido
- [ ] Probar tarjeta exitosa (4242...)
- [ ] Probar tarjeta rechazada (4000...)
- [ ] Verificar redirect a success page
- [ ] Verificar que webhook crea la orden
- [ ] Verificar datos en la orden creada

---

## 🔗 10. URLs de Callback

El frontend ya está configurado para estas URLs:

```python
# En tu código de backend:
success_url=f"{FRONTEND_URL}/checkout/stripe/success?session_id={{CHECKOUT_SESSION_ID}}"
cancel_url=f"{FRONTEND_URL}/checkout/stripe/cancel?session_id={{CHECKOUT_SESSION_ID}}"
```

Las páginas ya existen en:
- `/checkout/stripe/success` → Muestra éxito y detalles
- `/checkout/stripe/cancel` → Muestra cancelación y opciones

---

## 📚 Referencias

- [Stripe Docs - Embedded Checkout](https://stripe.com/docs/payments/checkout/how-checkout-works)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Python SDK](https://stripe.com/docs/api/python)
- [Checkout Session API](https://stripe.com/docs/api/checkout/sessions/create)
