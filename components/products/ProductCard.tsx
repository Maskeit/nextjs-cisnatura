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
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
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
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized={hasImage}
            priority={false}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-white px-4 py-2 rounded-lg font-semibold">
                Agotado
              </span>
            </div>
          )}
        </Link>

        <CardContent className="pt-4">
          {/* Nombre del producto */}
          <Link href={`/productos/${product.slug}`}>
            <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors mb-2">
              {product.name}
            </h3>
          </Link>

        {/* Descripción (opcional) */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Precio */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-primary">
            {formattedPrice}
          </span>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-2 text-sm">
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

      <CardFooter className="pt-0">
        <Button 
          className="w-full"
          disabled={isOutOfStock || isAdding}
          variant={isOutOfStock ? "outline" : "default"}
          onClick={handleAddToCart}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          {isOutOfStock ? 'No disponible' : isAdding ? 'Agregando...' : 'Agregar al carrito'}
        </Button>
      </CardFooter>
    </Card>
  );
}
