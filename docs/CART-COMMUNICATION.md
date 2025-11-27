# Sistema de Comunicación entre Componentes - Carrito de Compras

## 🔄 Arquitectura de Comunicación

El contador del carrito en el **Navbar** se sincroniza con las acciones del carrito usando el patrón **Event-Driven** con eventos nativos del navegador.

### Flujo de Comunicación

```
ProductCard/ProductDetail → CartController.addItem() → dispatch('cartUpdated')
       ↓
CarritoPage → handleUpdateQuantity() → dispatch('cartUpdated')
       ↓
   Navbar → addEventListener('cartUpdated') → updateCartCount()
       ↓
 CartController.getSummary() → Actualiza Badge
```

## 📋 Componentes Involucrados

### 1. **Navbar.tsx** (Receptor)
El componente que escucha los cambios y actualiza el contador:

```tsx
export default function Navbar() {
  const { isAuthenticated, isLoading } = useAuth();
  const [cartItemCount, setCartItemCount] = useState<number>(0);

  // ✅ Función memorizada con useCallback para evitar re-renders
  const updateCartCount = useCallback(async () => {
    if (!isAuthenticated || isLoading) {
      setCartItemCount(0);
      return;
    }
    
    const response = await CartController.getSummary();
    if (response.success) {
      setCartItemCount(response.data.total_items);
    }
  }, [isAuthenticated, isLoading]); // Dependencias necesarias

  // Cargar contador al montar
  useEffect(() => {
    updateCartCount();
  }, [isAuthenticated, isLoading]);

  // ✅ Escuchar eventos de actualización
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleCartUpdate = () => {
      console.log('Cart update event received');
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [isAuthenticated, updateCartCount]); // updateCartCount en dependencias
}
```

**Problemas Comunes Corregidos:**
- ✅ `useCallback` para memorizar `updateCartCount`
- ✅ `updateCartCount` en las dependencias del segundo `useEffect`
- ✅ Verificación de `!isAuthenticated` antes de escuchar eventos
- ✅ Limpieza del event listener en el cleanup

### 2. **ProductCard.tsx** (Emisor)
Dispara el evento cuando se agrega un producto:

```tsx
const handleAddToCart = async () => {
  try {
    const response = await CartController.addItem({
      product_id: product.id,
      quantity: 1,
    });

    if (response.success) {
      toast.success('Producto agregado al carrito');
      
      // ✅ Disparar evento para actualizar el Navbar
      window.dispatchEvent(new Event('cartUpdated'));
    }
  } catch (error) {
    toast.error('Error al agregar al carrito');
  }
};
```

### 3. **CarritoPage.tsx** (Emisor)
Dispara el evento en operaciones del carrito:

```tsx
const handleUpdateQuantity = async (productId: number, quantity: number) => {
  const response = await CartController.updateItem(productId, { quantity });
  if (response.success) {
    setCart(response.data);
    // ✅ Notificar cambio
    window.dispatchEvent(new Event('cartUpdated'));
  }
};

const handleRemoveItem = async (productId: number) => {
  const response = await CartController.removeItem(productId);
  if (response.success) {
    setCart(response.data);
    // ✅ Notificar cambio
    window.dispatchEvent(new Event('cartUpdated'));
  }
};

const handleClearCart = async () => {
  const response = await CartController.clearCart();
  if (response.success) {
    setCart(response.data);
    // ✅ Notificar cambio
    window.dispatchEvent(new Event('cartUpdated'));
  }
};
```

## 🛠️ CartController - API del Carrito

```tsx
class CartController {
  // Obtener resumen del carrito (usado por Navbar)
  static getSummary = async (): Promise<CartSummaryResponse> => {
    const response = await api.get("/cart/summary/"); // ⚠️ Slash al final
    return response.data;
  };

  // Agregar producto al carrito
  static addItem = async (data: AddToCartRequest): Promise<CartResponse> => {
    const response = await api.post("/cart/items/", data);
    return response.data;
  };

  // Actualizar cantidad
  static updateItem = async (productId: number, data: UpdateCartItemRequest) => {
    const response = await api.put(`/cart/items/${productId}/`, data);
    return response.data;
  };

  // Eliminar producto
  static removeItem = async (productId: number): Promise<CartResponse> => {
    const response = await api.delete(`/cart/items/${productId}/`);
    return response.data;
  };

  // Vaciar carrito
  static clearCart = async (): Promise<CartResponse> => {
    const response = await api.delete("/cart/clear/");
    return response.data;
  };
}
```

## 🔍 Debugging - Cómo Verificar

### 1. Verificar que se dispara el evento

Agrega console.log en los emisores:

```tsx
// En ProductCard.tsx
if (response.success) {
  console.log('✅ Dispatching cartUpdated event');
  window.dispatchEvent(new Event('cartUpdated'));
}
```

### 2. Verificar que se recibe el evento

Ya agregado en Navbar:

```tsx
const handleCartUpdate = () => {
  console.log('✅ Cart update event received in Navbar');
  updateCartCount();
};
```

### 3. Verificar la respuesta de la API

```tsx
const response = await CartController.getSummary();
console.log('📊 Cart summary:', response.data);
// Debe mostrar: { total_items: 3, total_amount: 150.00 }
```

### 4. Verificar autenticación

El contador solo se actualiza si el usuario está autenticado:

```tsx
console.log('🔐 Auth state:', { isAuthenticated, isLoading });
```

### 5. Abrir DevTools del navegador

**Console Tab:**
- Busca los mensajes: "Cart update event received"
- Busca errores de red (401, 404, etc.)

**Network Tab:**
- Busca la petición a `/cart/summary/`
- Verifica que el status sea 200
- Verifica que devuelva `{ success: true, data: { total_items: X } }`

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: El contador no se actualiza al agregar productos
**Causa:** El evento no se está escuchando correctamente o no se está disparando.

**Solución:**
```tsx
// ✅ Verificar que updateCartCount esté en useCallback
const updateCartCount = useCallback(async () => {
  // ...
}, [isAuthenticated, isLoading]);

// ✅ Verificar que updateCartCount esté en las dependencias
useEffect(() => {
  // ...
  window.addEventListener('cartUpdated', handleCartUpdate);
  return () => window.removeEventListener('cartUpdated', handleCartUpdate);
}, [isAuthenticated, updateCartCount]); // ⬅️ Incluir updateCartCount
```

### Problema 2: Error 307 en `/cart/summary`
**Causa:** Falta el slash final en el endpoint.

**Solución:**
```tsx
// ❌ Incorrecto
const response = await api.get("/cart/summary");

// ✅ Correcto
const response = await api.get("/cart/summary/");
```

### Problema 3: Re-renders infinitos
**Causa:** `updateCartCount` no está memorizada con `useCallback`.

**Solución:**
```tsx
// ✅ Usar useCallback
const updateCartCount = useCallback(async () => {
  // ...
}, [isAuthenticated, isLoading]);
```

### Problema 4: El contador se queda en 0 aunque hay productos
**Causa:** El usuario no está autenticado o el endpoint devuelve error.

**Solución:**
```tsx
// Verificar autenticación
if (!isAuthenticated || isLoading) {
  console.log('⚠️ User not authenticated');
  setCartItemCount(0);
  return;
}

// Manejar errores
catch (error: any) {
  console.error('❌ Error fetching cart:', error);
  if (error.response?.status === 401) {
    setCartItemCount(0);
  }
}
```

## 🎯 Alternativas de Comunicación

### Opción 1: Custom Events con Datos
Puedes pasar datos en el evento:

```tsx
// Emisor
window.dispatchEvent(new CustomEvent('cartUpdated', { 
  detail: { itemCount: 5 } 
}));

// Receptor
window.addEventListener('cartUpdated', (e: CustomEvent) => {
  console.log('New count:', e.detail.itemCount);
});
```

### Opción 2: Context API
Más robusto para aplicaciones grandes:

```tsx
// CartContext.tsx
export const CartContext = createContext();

export function CartProvider({ children }) {
  const [itemCount, setItemCount] = useState(0);
  
  const updateCart = async () => {
    const response = await CartController.getSummary();
    setItemCount(response.data.total_items);
  };
  
  return (
    <CartContext.Provider value={{ itemCount, updateCart }}>
      {children}
    </CartContext.Provider>
  );
}

// Usar en componentes
const { itemCount, updateCart } = useContext(CartContext);
```

### Opción 3: State Management (Zustand/Redux)
Para aplicaciones muy grandes:

```tsx
// store/cartStore.ts
import { create } from 'zustand';

export const useCartStore = create((set) => ({
  itemCount: 0,
  updateCount: async () => {
    const response = await CartController.getSummary();
    set({ itemCount: response.data.total_items });
  },
}));

// Usar en componentes
const { itemCount, updateCount } = useCartStore();
```

## ✅ Checklist de Implementación

- [x] `useCallback` en `updateCartCount`
- [x] Dependencias correctas en `useEffect`
- [x] Event listener con cleanup
- [x] Slash final en endpoints (`/cart/summary/`)
- [x] Verificación de autenticación
- [x] Manejo de errores (401, etc.)
- [x] Console.log para debugging
- [x] Disparar evento después de cada operación del carrito

## 📊 Resultado Esperado

Después de aplicar todos los cambios:

1. ✅ Al agregar un producto → Badge se actualiza inmediatamente
2. ✅ Al actualizar cantidad en carrito → Badge refleja el cambio
3. ✅ Al eliminar producto → Badge se actualiza
4. ✅ Al vaciar carrito → Badge desaparece (muestra 0)
5. ✅ Al hacer login → Badge carga el conteo correcto
6. ✅ Al hacer logout → Badge se limpia
