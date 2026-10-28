'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/interfaces/Products';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import CartController from '@/lib/CartController';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

interface CartError {
  response?: { status?: number; data?: { error?: string; message?: string } };
}

const formatMXN = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock < 10;
  const discount = product.has_discount ? product.discount : null;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const response = await CartController.addItem({
        product_id: product.id,
        quantity: 1,
      });

      if (response.success) {
        toast.success('Producto agregado al carrito');
        // Disparar evento para actualizar el contador del navbar
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      const error = err as CartError;
      console.error('Error al agregar al carrito:', err);

      // Si es 401 o AUTHENTICATION_REQUIRED, redirigir a login
      if (error.response?.status === 401 || error.response?.data?.error === 'AUTHENTICATION_REQUIRED') {
        toast.info('Inicia sesión para agregar productos a tu carrito', {
          action: {
            label: 'Iniciar sesión',
            onClick: () => router.push('/login')
          },
        });
        setTimeout(() => router.push('/login'), 2000);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response) {
        // Solo mostrar error si no es 401
        toast.error('Error al agregar el producto al carrito');
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Construir URL completa de la imagen
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const imageUrl = product.image_url
    ? `${apiBase}${product.image_url}`
    : '/placeholder.png';

  const hasImage = !!product.image_url;

  return (
    // Toda la tarjeta es clickeable: el enlace del nombre se estira sobre ella
    // (after:inset-0) y el botón de carrito queda encima (z-10). Así hay un solo
    // <a> por tarjeta y no se anida un <button> dentro de un enlace.
    <Card className="group/card relative h-full gap-0 overflow-hidden rounded-2xl p-0 transition-shadow hover:shadow-lg focus-within:ring-2 focus-within:ring-ring/50">
      {/* ── Imagen ── */}
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
          sizes="(max-width: 640px) 45vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized={hasImage}
          priority={false}
        />

        {/* Descuento: siempre visible */}
        {discount && (
          <span className="absolute left-2 top-2 select-none rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-xs">
            −{discount.discount_percentage}%
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-lg bg-destructive px-3 py-1 text-xs font-semibold text-white md:px-4 md:py-2 md:text-sm">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* ── Información ── */}
      <CardContent className="flex-1 space-y-1 px-3 pb-3 pt-3 md:px-4 md:pt-4">
        {/* Nombre: 2 líneas de alto fijo para que todas las tarjetas midan igual */}
        <h3 className="h-10 text-sm font-bold leading-5 text-foreground md:text-base md:leading-5">
          <Link
            href={`/productos/${product.slug}`}
            title={product.name}
            className="line-clamp-2 outline-none after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </h3>

        {/* Precio */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1">
          {discount && (
            <span className="text-xs font-semibold text-primary md:text-sm">
              ↓{discount.discount_percentage}%
            </span>
          )}
          {discount && (
            <span className="text-xs text-muted-foreground line-through md:text-sm">
              {formatMXN(discount.original_price)}
            </span>
          )}
          <span className="text-base font-bold text-foreground md:text-lg">
            {formatMXN(product.price)}
          </span>
        </div>

        {/* Estado: una sola línea de alto fijo (stock bajo > promoción > disponible) */}
        <p
          className={cn(
            'h-4 truncate text-xs font-medium',
            isOutOfStock && 'text-destructive',
            isLowStock && 'text-orange-600',
            !isOutOfStock && !isLowStock && (discount ? 'text-primary' : 'text-muted-foreground'),
          )}
        >
          {isOutOfStock
            ? 'Sin stock'
            : isLowStock
              ? `¡Solo quedan ${product.stock}!`
              : discount
                ? `🎉 ${discount.discount_name}`
                : 'Disponible'}
        </p>
      </CardContent>

      {/* ── Acción principal ── */}
      <CardFooter className="border-t-0 bg-transparent px-3 pb-3 md:px-4 md:pb-4">
        <Button
          className="group/btn relative z-10 h-10 w-full cursor-pointer gap-2 overflow-hidden rounded-xl border border-primary text-sm font-semibold md:h-12 md:text-base"
          disabled={isOutOfStock || isAdding}
          variant={isOutOfStock ? 'outline' : 'default'}
          onClick={handleAddToCart}
        >
          {/* Efecto ripple al pasar el cursor */}
          <span className="absolute left-1/2 top-full h-8 w-8 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-background transition-transform duration-700 ease-in-out group-hover/btn:scale-[20]" />
          <span className="relative z-10 flex items-center gap-2 transition-colors duration-500 group-hover/btn:text-primary">
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isOutOfStock ? 'No disponible' : isAdding ? 'Agregando...' : 'Agregar al carrito'}
            </span>
            <span className="sm:hidden">
              {isOutOfStock ? 'Agotado' : isAdding ? '...' : 'Agregar'}
            </span>
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}
