# Arquitectura del Proyecto - Cisnatura E-commerce

## Estructura de Carpetas

```
nextjs-cisnatura/
├── app/
│   ├── layout.tsx                 # Layout principal con Header y Footer
│   ├── page.tsx                   # Página de inicio (Home/Catálogo)
│   ├── globals.css                # Estilos globales con paleta verde agua
│   ├── login/
│   │   └── page.tsx              # Página de login/registro
│   ├── carrito/
│   │   └── page.tsx              # Carrito de compras
│   ├── domicilio/
│   │   └── page.tsx              # Gestión de direcciones de envío
│   ├── orden-summary/
│   │   └── page.tsx              # Resumen de orden antes de pagar
│   └── resumen-compra/
│       └── page.tsx              # Confirmación de compra realizada
├── components/
│   ├── Header.tsx                 # Header con logo, búsqueda, perfil y carrito
│   └── Footer.tsx                 # Footer con información y enlaces
└── public/                        # Archivos estáticos (imágenes, etc.)
```

## Rutas de la Aplicación

| Ruta | Descripción | Componente |
|------|-------------|------------|
| `/` | Página de inicio con catálogo de productos | `app/page.tsx` |
| `/login` | Login y registro de usuarios | `app/login/page.tsx` |
| `/carrito` | Carrito de compras | `app/carrito/page.tsx` |
| `/domicilio` | Gestión de direcciones de envío | `app/domicilio/page.tsx` |
| `/orden-summary` | Resumen de la orden antes de pagar | `app/orden-summary/page.tsx` |
| `/resumen-compra` | Confirmación de compra | `app/resumen-compra/page.tsx` |

## Flujo de Navegación

```
1. [/] Home (Catálogo)
   ↓
2. [/carrito] Carrito
   ↓
3. [/domicilio] Dirección de Envío
   ↓
4. [/orden-summary] Resumen de Orden
   ↓
5. [Pasarela de Pago]
   ↓
6. [/resumen-compra] Confirmación
```

## Componentes Principales

### Header
- Logo de Cisnatura
- Barra de búsqueda
- Icono de perfil (con dropdown para login/logout)
- Icono de carrito con contador de productos

### Footer
- Información de la tienda
- Enlaces rápidos
- Información de contacto
- Copyright

## Paleta de Colores

- **Primary**: `#7dd3c0` (Verde agua)
- **Primary Light**: `#a8e6d7` (Verde agua claro)
- **Primary Dark**: `#5fb9a8` (Verde agua oscuro)
- **Background**: `#f8fffe` (Blanco con tinte verde)
- **Foreground**: `#1a1a1a` (Negro para texto)
- **Border**: `#d4f1ea` (Verde muy claro para bordes)

## Características de la UI

- ✅ Fondos claros con paleta verde agua
- ✅ Texto con alto contraste para personas mayores
- ✅ Diseño simple y fácil de entender
- ✅ Precios y botones claros
- ✅ Sin animaciones excesivas
- ✅ Responsive design con Tailwind CSS

## Próximos Pasos

1. Implementar el catálogo de productos en la página de inicio
2. Crear formulario de login/registro
3. Implementar funcionalidad del carrito
4. Crear formulario de direcciones
5. Diseñar página de resumen de orden
6. Integrar pasarela de pagos
7. Configurar Firebase/API para autenticación
8. Implementar middleware de autorización
