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
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  
  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(product.price);

  const isOutOfStock = product.stock === 0;

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
    } catch (error: any) {
      console.error('Error al agregar al carrito:', error);
      
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
  const imageUrl = product.image_url 
    ? `${process.env.NEXT_PUBLIC_API_URL}${product.image_url}`
    : '/placeholder.png';
  
  const hasImage = !!product.image_url;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
        {/* Imagen del producto */}
        <Link 
          href={`/productos/${product.slug}`}
          className="block relative aspect-square overflow-hidden"
        >
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized={hasImage}
            priority={false}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-white px-2 md:px-4 py-1 md:py-2 rounded-lg font-semibold text-xs md:text-sm">
                Agotado
              </span>
            </div>
          )}
          {/* Badge de descuento */}
          {product.has_discount && product.discount && (
            <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white px-1.5 py-0.5 md:px-3 md:py-1 rounded-full font-bold text-[10px] md:text-sm shadow-lg">
              -{product.discount.discount_percentage}%
            </div>
          )}
        </Link>

        <CardContent className="pt-2 md:pt-4 px-2 md:px-6 flex-1 flex flex-col">
          {/* Nombre del producto */}
          <Link href={`/productos/${product.slug}`}>
            <h3 className="font-semibold text-xs md:text-lg line-clamp-2 hover:text-primary transition-colors mb-1 md:mb-2">
              {product.name}
            </h3>
          </Link>

        {/* Descripción (opcional) - Solo en desktop */}
        {product.description && (
          <p className="hidden md:block text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Precio */}
        <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2 mb-1 md:mb-2">
          {product.has_discount && product.discount ? (
            <>
              <span className="text-sm md:text-2xl font-bold text-primary">
                {formattedPrice}
              </span>
              <span className="text-[10px] md:text-lg text-muted-foreground line-through">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(product.discount.original_price)}
              </span>
            </>
          ) : (
            <span className="text-sm md:text-2xl font-bold text-primary">
              {formattedPrice}
            </span>
          )}
        </div>
        
        {/* Nombre del descuento */}
        {product.has_discount && product.discount && (
          <div className="mb-1 md:mb-2">
            <span className="text-[9px] md:text-xs font-medium text-red-600 dark:text-red-400 line-clamp-1">
              🎉 {product.discount.discount_name}
            </span>
          </div>
        )}

        {/* Stock - Solo en desktop */}
        <div className="hidden md:flex items-center gap-2 text-sm mt-auto">
          {isOutOfStock ? (
            <span className="text-destructive font-medium">Sin stock</span>
          ) : product.stock < 10 ? (
            <span className="text-orange-600 font-medium">
              ¡Solo quedan {product.stock}!
            </span>
          ) : (
            <span className="text-green-600 font-medium">Disponible</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-2 md:px-6 pb-2 md:pb-6 mt-auto">
        <Button 
          className="w-full h-8 md:h-10 text-xs md:text-sm"
          disabled={isOutOfStock || isAdding}
          variant={isOutOfStock ? "outline" : "default"}
          onClick={handleAddToCart}
        >
          {isAdding ? (
            <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          )}
          <span className="hidden sm:inline">{isOutOfStock ? 'No disponible' : isAdding ? 'Agregando...' : 'Agregar al carrito'}</span>
          <span className="sm:hidden">{isOutOfStock ? 'Agotado' : isAdding ? '...' : 'Agregar'}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
