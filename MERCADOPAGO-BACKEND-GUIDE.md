# Guía de Integración Mercado Pago Backend (Python/FastAPI)

## 🔑 1. Claves y Tokens

### Backend (Python)
```python
# .env del backend
MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxx-xxxx"  # ⚠️ PRIVADO - NUNCA expongas
```

### Frontend (Next.js)
```env
# .env.local del frontend
NEXT_PUBLIC_MP_PUBLIC_KEY="APP_USR-xxx-xxx"  # Público (solo para SDK, NO lo usas)
```

### ¿Cuál usar?
- **Backend**: Usa `ACCESS_TOKEN` (APP_USR-xxxx-xxxx) para crear preferencias
- **Frontend**: NO necesitas ninguna clave si usas redirect (tu caso actual)
- **SDK React**: Solo necesitarías `PUBLIC_KEY` si usas el componente Wallet (no recomendado)

---

## 📦 2. Estructura de la Preferencia (CRÍTICO)

Tu backend debe recibir:

```python
# POST /payments/create-from-cart
{
    "address_id": 1,
    "payment_method": "mercadopago",
    "shipping_cost": 140.00  # ⚠️ NUEVO: El frontend te envía esto
}
```

Y crear una preferencia así:

```python
import mercadopago
from typing import List, Dict

sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)

def create_payment_from_cart(
    user_id: str,
    address_id: int,
    shipping_cost: float = 0.0
) -> Dict:
    """
    Crea preferencia de MP desde el carrito Redis
    """
    
    # 1️⃣ Obtener carrito de Redis
    cart = redis_client.get(f"cart:{user_id}")
    if not cart:
        raise HTTPException(400, "Carrito vacío")
    
    cart_data = json.loads(cart)
    
    # 2️⃣ Validar stock y construir items
    items = []
    subtotal = 0.0
    
    for cart_item in cart_data["items"]:
        product = get_product_by_id(cart_item["product_id"])
        
        if product.stock < cart_item["quantity"]:
            raise HTTPException(400, f"Stock insuficiente: {product.name}")
        
        unit_price = float(product.price)
        quantity = cart_item["quantity"]
        
        items.append({
            "id": str(product.id),
            "title": product.name,
            "description": product.description[:255] if product.description else "",
            "picture_url": f"{FRONTEND_URL}{product.image_url}" if product.image_url else None,
            "category_id": "beauty",  # O tu categoría
            "quantity": quantity,
            "unit_price": unit_price,
            "currency_id": "MXN"
        })
        
        subtotal += unit_price * quantity
    
    # 3️⃣ ⚠️ AGREGAR ENVÍO COMO ITEM SEPARADO (si no es gratis)
    if shipping_cost > 0:
        items.append({
            "id": "shipping",
            "title": "Costo de envío",
            "description": "Envío a domicilio",
            "quantity": 1,
            "unit_price": float(shipping_cost),
            "currency_id": "MXN"
        })
    
    total_amount = subtotal + shipping_cost
    
    # 4️⃣ Crear la preferencia
    preference_data = {
        "items": items,
        
        # External reference DEBE empezar con "cart_" para que el webhook lo reconozca
        "external_reference": f"cart_{user_id}_{address_id}_{int(time.time())}",
        
        # URLs de retorno
        "back_urls": {
            "success": f"{FRONTEND_URL}/checkout/success",
            "failure": f"{FRONTEND_URL}/checkout/failure",
            "pending": f"{FRONTEND_URL}/checkout/pending"
        },
        "auto_return": "approved",
        
        # Metadata útil para el webhook
        "metadata": {
            "user_id": user_id,
            "address_id": address_id,
            "subtotal": subtotal,
            "shipping_cost": shipping_cost,
            "total": total_amount,
            "cart_snapshot": json.dumps(cart_data["items"])  # Snapshot del carrito
        },
        
        # Configuración de pago
        "payment_methods": {
            "excluded_payment_types": [
                # {"id": "ticket"}  # Descomentar para excluir OXXO/efectivo
            ],
            "installments": 12  # Hasta 12 meses sin intereses
        },
        
        # Notificación webhook
        "notification_url": f"{BACKEND_URL}/payments/webhook/mercadopago",
        
        # Info del comprador (opcional pero recomendado)
        "payer": {
            "name": address.full_name.split()[0] if address else "",
            "surname": " ".join(address.full_name.split()[1:]) if address else "",
            "email": user.email,
            "phone": {
                "number": address.phone if address else ""
            },
            "address": {
                "street_name": address.street if address else "",
                "zip_code": address.postal_code if address else ""
            }
        }
    }
    
    # 5️⃣ Crear preferencia en Mercado Pago
    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]
    
    return {
        "preference_id": preference["id"],
        "checkout_url": preference["init_point"],  # Producción
        "sandbox_url": preference["sandbox_init_point"]  # Sandbox
    }
```

---

## 🎯 3. Webhook para crear la orden

```python
from fastapi import Request

@router.post("/payments/webhook/mercadopago")
async def mercadopago_webhook(request: Request):
    """
    Webhook que recibe notificaciones de Mercado Pago
    """
    
    try:
        body = await request.json()
        
        # Solo procesamos notificaciones de pago
        if body.get("type") != "payment":
            return {"status": "ignored"}
        
        payment_id = body["data"]["id"]
        
        # Obtener detalles del pago
        payment_info = sdk.payment().get(payment_id)
        payment = payment_info["response"]
        
        # Verificar estado del pago
        if payment["status"] != "approved":
            return {"status": "payment_not_approved"}
        
        external_reference = payment.get("external_reference", "")
        
        # Verificar que sea un pago desde carrito
        if not external_reference.startswith("cart_"):
            return {"status": "not_cart_payment"}
        
        # Extraer datos del external_reference
        # Formato: "cart_{user_id}_{address_id}_{timestamp}"
        parts = external_reference.split("_")
        user_id = parts[1]
        address_id = int(parts[2])
        
        # Obtener metadata
        metadata = payment.get("metadata", {})
        shipping_cost = float(metadata.get("shipping_cost", 0))
        
        # ⚠️ VERIFICAR QUE NO EXISTA YA UNA ORDEN CON ESTE PAYMENT_ID
        existing_order = db.query(Order).filter(
            Order.payment_id == str(payment_id)
        ).first()
        
        if existing_order:
            return {"status": "order_already_exists", "order_id": existing_order.id}
        
        # 1️⃣ Leer carrito de Redis
        cart = redis_client.get(f"cart:{user_id}")
        if not cart:
            raise HTTPException(400, "Carrito no encontrado")
        
        cart_data = json.loads(cart)
        
        # 2️⃣ Crear la orden en PostgreSQL
        order = Order(
            user_id=user_id,
            address_id=address_id,
            payment_method="mercadopago",
            payment_id=str(payment_id),
            payment_status="approved",
            status="paid",
            subtotal=payment["transaction_amount"] - shipping_cost,
            shipping_cost=shipping_cost,
            tax=0.0,
            total=payment["transaction_amount"]
        )
        db.add(order)
        db.flush()  # Para obtener el order.id
        
        # 3️⃣ Crear order_items
        for cart_item in cart_data["items"]:
            product = get_product_by_id(cart_item["product_id"])
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=cart_item["quantity"],
                unit_price=product.price,
                subtotal=product.price * cart_item["quantity"]
            )
            db.add(order_item)
            
            # 4️⃣ Reducir stock
            product.stock -= cart_item["quantity"]
        
        db.commit()
        
        # 5️⃣ Limpiar carrito de Redis
        redis_client.delete(f"cart:{user_id}")
        
        return {
            "status": "success",
            "order_id": order.id,
            "payment_id": payment_id
        }
        
    except Exception as e:
        print(f"Error en webhook: {str(e)}")
        return {"status": "error", "message": str(e)}
```

---

## 🧪 4. Tarjetas de Prueba

### ✅ Tarjetas que funcionan en Sandbox

| Tarjeta | Número | CVV | Fecha | Resultado |
|---------|--------|-----|-------|-----------|
| **Visa aprobada** | 4509 9535 6623 3704 | 123 | 11/25 | ✅ Aprobado |
| **Mastercard aprobada** | 5031 7557 3453 0604 | 123 | 11/25 | ✅ Aprobado |
| **American Express** | 3711 803032 57522 | 1234 | 11/25 | ✅ Aprobado |
| **Rechazada** | 4000 0000 0000 0001 | 123 | 11/25 | ❌ Rechazado |

### Usuarios de prueba
```bash
# Crear usuarios de prueba
curl -X POST \
  'https://api.mercadopago.com/users/test_user' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "site_id": "MLM"
  }'
```

---

## 🐛 5. Debugging: Por qué no funciona

### Problema 1: "No acepta tarjetas de prueba"
**Causa**: Estás usando el ACCESS_TOKEN de producción en lugar del de testing

**Solución**:
```python
# ❌ MALO - Token de producción
MERCADOPAGO_ACCESS_TOKEN = "APP_USR-123456-123456-abcd1234abcd1234-123456"

# ✅ BUENO - Token de testing (tiene TEST en el nombre)
MERCADOPAGO_ACCESS_TOKEN = "TEST-123456789-123456-abcd1234-123456789"
```

### Problema 2: "Monto incorrecto en checkout"
**Causa**: No estás sumando el `shipping_cost` a los items

**Solución**: Ver código de la sección 2 arriba ☝️

### Problema 3: "Webhook no se ejecuta"
**Causa**: Mercado Pago no puede alcanzar tu localhost

**Soluciones**:
```bash
# Opción 1: Usar ngrok
ngrok http 8000
# Usar la URL de ngrok en notification_url

# Opción 2: Desplegar a un servidor con IP pública

# Opción 3: Probar manualmente
curl -X POST http://localhost:8000/payments/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {"id": "123456789"}
  }'
```

### Problema 4: "Orden duplicada"
**Causa**: El webhook se llama múltiples veces

**Solución**: Verificar si existe orden con ese `payment_id` (ver código webhook)

---

## ✅ 6. Checklist de Validación

### En el Backend:
- [ ] Usar `TEST-*` access token para pruebas
- [ ] Incluir `shipping_cost` en items (si > 0)
- [ ] `external_reference` empieza con `"cart_"`
- [ ] `notification_url` apunta a webhook público
- [ ] Webhook verifica `payment["status"] == "approved"`
- [ ] Webhook previene órdenes duplicadas
- [ ] Webhook reduce stock
- [ ] Webhook limpia carrito Redis

### En el Frontend:
- [ ] Enviar `shipping_cost` en el payload
- [ ] Usar `sandbox_url` en development
- [ ] Usar `checkout_url` en production
- [ ] Callback pages funcionan (success/failure/pending)

---

## 📝 7. Ejemplo Completo de Respuesta Correcta

### Request del frontend:
```json
POST /payments/create-from-cart
{
  "address_id": 1,
  "payment_method": "mercadopago",
  "shipping_cost": 140.00
}
```

### Response del backend:
```json
{
  "success": true,
  "status_code": 200,
  "message": "Preferencia creada",
  "data": {
    "preference_id": "3029369388-abc123",
    "checkout_url": "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=3029369388-abc123",
    "sandbox_url": "https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=3029369388-abc123"
  }
}
```

### Preferencia enviada a Mercado Pago:
```json
{
  "items": [
    {
      "id": "123",
      "title": "Shampoo Orgánico",
      "quantity": 2,
      "unit_price": 199.50,
      "currency_id": "MXN"
    },
    {
      "id": "456",
      "title": "Acondicionador Natural",
      "quantity": 1,
      "unit_price": 225.00,
      "currency_id": "MXN"
    },
    {
      "id": "shipping",
      "title": "Costo de envío",
      "quantity": 1,
      "unit_price": 140.00,
      "currency_id": "MXN"
    }
  ],
  "external_reference": "cart_user123_1_1733356800",
  "metadata": {
    "user_id": "user123",
    "address_id": 1,
    "subtotal": 624.00,
    "shipping_cost": 140.00,
    "total": 764.00
  }
}
```

**Total en Mercado Pago**: $764.00 ✅

---

## 🚀 8. Comandos Útiles

```bash
# Ver logs del webhook en FastAPI
tail -f logs/uvicorn.log | grep webhook

# Probar webhook manualmente
curl -X GET \
  "https://api.mercadopago.com/v1/payments/PAYMENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Ver preferencia creada
curl -X GET \
  "https://api.mercadopago.com/checkout/preferences/PREFERENCE_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📚 Referencias

- [Mercado Pago Docs - Checkout Pro](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/landing)
- [Webhooks](https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks)
- [Tarjetas de Prueba](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/test-cards)
- [SDK Python](https://github.com/mercadopago/sdk-python)
