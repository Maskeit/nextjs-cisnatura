# Corrección de Errores de Hidratación en React/Next.js

## ✅ Problemas Identificados y Corregidos

### 1. **ModeToggle Component** - Uso de clases dark: sin protección
**Problema:** El componente usaba clases de Tailwind con `dark:` que causaban diferencias entre servidor y cliente.

**Solución Implementada:**
```tsx
// Antes (causaba hydration mismatch)
export function ModeToggle() {
  const { setTheme } = useTheme()
  return <Button className="dark:bg-zinc-800">...</Button>
}

// Después (con protección)
export function ModeToggle() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <Button className="bg-zinc-100">...</Button> // Sin dark:
  }
  
  return <Button className="dark:bg-zinc-800">...</Button>
}
```

### 2. **Formateo de Fechas** - toLocaleDateString() y toLocaleTimeString()
**Problema:** El formateo con locales puede generar resultados diferentes entre servidor y cliente debido a:
- Diferencias de timezone
- Configuración regional del servidor vs cliente
- Formato de fecha/hora dependiente del navegador

**Archivos afectados:**
- ✅ `components/user/orders/OrdersTable.tsx`
- ✅ `components/user/orders/OrderDetailContent.tsx`
- ✅ `components/admin/users/UserDetailContent.tsx`

**Solución Implementada:**
Creé utilidades de formateo consistentes en `lib/dateUtils.ts`:
```tsx
import { formatDate, formatDateLong, formatTime, formatDateTime } from '@/lib/dateUtils';

// Antes
{new Date(order.created_at).toLocaleDateString('es-MX', { 
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

// Después
{formatDateLong(order.created_at)} // "1 de enero de 2024"
{formatDate(order.created_at)}     // "01/01/2024"
{formatTime(order.created_at)}     // "14:30"
```

## 📋 Mejores Prácticas para Evitar Hydration Errors

### 1. **Componentes con Temas (next-themes)**
Siempre usar un estado de "mounted" para componentes que dependen del tema:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function ThemeComponent() {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  
  useEffect(() => setMounted(true), [])
  
  if (!mounted) {
    return <div>Cargando...</div> // Fallback sin dependencias del tema
  }
  
  return <div className={theme === 'dark' ? '...' : '...'}>...</div>
}
```

### 2. **Formateo de Fechas y Horas**
❌ **NUNCA usar:**
```tsx
new Date().toLocaleDateString()
new Date().toLocaleTimeString()
Date.now() // en el render
```

✅ **SÍ usar:**
```tsx
// Opción 1: Funciones de utilidad consistentes
import { formatDate } from '@/lib/dateUtils'
{formatDate(dateString)}

// Opción 2: Componente cliente con useEffect
const [formattedDate, setFormattedDate] = useState('')
useEffect(() => {
  setFormattedDate(new Date(date).toLocaleDateString())
}, [date])
```

### 3. **Datos Dinámicos del Cliente**
❌ **NUNCA usar directamente en el render:**
```tsx
// Estos cambian en cada render
Math.random()
Date.now()
window.innerWidth
typeof window !== 'undefined'
```

✅ **SÍ usar con useEffect:**
```tsx
const [value, setValue] = useState<number | null>(null)

useEffect(() => {
  setValue(Math.random())
}, [])

if (value === null) return <Skeleton />
return <div>{value}</div>
```

### 4. **localStorage y otras APIs del Navegador**
❌ **NUNCA acceder directamente:**
```tsx
const savedValue = localStorage.getItem('key') // Error: localStorage no existe en servidor
```

✅ **SÍ usar con protección:**
```tsx
const [savedValue, setSavedValue] = useState<string | null>(null)

useEffect(() => {
  setSavedValue(localStorage.getItem('key'))
}, [])
```

### 5. **HTML Inválido o Anidamiento Incorrecto**
❌ **NUNCA anidar incorrectamente:**
```tsx
<p>
  <div>Esto causará error</div> {/* div no puede estar dentro de p */}
</p>

<button>
  <button>Anidamiento inválido</button>
</button>
```

✅ **SÍ usar estructura válida:**
```tsx
<div>
  <div>Correcto</div>
</div>

<button>
  <span>Contenido del botón</span>
</button>
```

### 6. **IDs Únicos**
❌ **NUNCA generar IDs aleatorios:**
```tsx
const id = Math.random().toString() // Diferente en servidor y cliente
```

✅ **SÍ usar useId o IDs estáticos:**
```tsx
import { useId } from 'react'

const id = useId() // Consistente entre servidor y cliente
// o
const id = `item-${index}` // ID basado en datos estables
```

## 🔍 Cómo Detectar Problemas de Hidratación

### En el Navegador:
1. Abre las DevTools (F12)
2. Ve a la consola
3. Busca mensajes que contengan:
   - "Hydration failed"
   - "Text content does not match"
   - "server-rendered HTML"

### Herramientas de Debugging:
```tsx
// En next.config.js
module.exports = {
  reactStrictMode: true, // Ayuda a detectar problemas
}
```

### Inspeccionar Elemento Específico:
React Dev Tools te mostrará exactamente qué props no coinciden.

## 🛠️ Pasos para Corregir un Error Nuevo

1. **Identifica el componente:** El error te dirá qué componente falló
2. **Busca las causas comunes:**
   - Formateo de fechas
   - Acceso a APIs del navegador (window, localStorage, etc.)
   - Generación de valores aleatorios
   - Dependencias del tema sin mounted check
   - HTML inválido

3. **Aplica la solución:**
   - Usa `useState` + `useEffect` para valores dinámicos
   - Usa funciones de utilidad para formateo
   - Añade checks de `mounted` para temas
   - Valida tu HTML

4. **Verifica:**
   - Reinicia el servidor de desarrollo
   - Limpia caché del navegador
   - Verifica que el error desaparezca

## 📁 Archivos Actualizados

Los siguientes archivos han sido corregidos:

1. ✅ `components/ModeToggle.tsx` - Agregado mounted check
2. ✅ `lib/dateUtils.ts` - Utilidades de formateo creadas
3. ✅ `components/user/orders/OrdersTable.tsx` - Formateo de fechas
4. ✅ `components/user/orders/OrderDetailContent.tsx` - Formateo de fechas
5. ✅ `components/admin/users/UserDetailContent.tsx` - Formateo de fechas

## 🎯 Resultado

Después de aplicar estos cambios:
- ✅ El error de hidratación debería desaparecer
- ✅ Las fechas se mostrarán consistentemente
- ✅ El toggle de tema funcionará sin errores
- ✅ La aplicación será más estable y predecible

Si el error persiste, revisa:
1. Extensiones del navegador (desactívalas temporalmente)
2. Caché del navegador (Ctrl + Shift + R para hard refresh)
3. Otros componentes que puedan usar APIs del navegador
