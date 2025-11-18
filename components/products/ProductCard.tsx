'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/interfaces/Products';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import ProductDetailDialog from './ProductDetailDialog';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(product.price);

  const isOutOfStock = product.stock === 0;

  // Construir URL completa de la imagen
  const imageUrl = product.image_url 
    ? `${process.env.NEXT_PUBLIC_API_URL}/static/products/${product.image_url}`
    : '/placeholder-product.jpg';

  return (
    <>
      <Card className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer">
        {/* Imagen del producto */}
        <div 
          onClick={() => setIsDialogOpen(true)}
          className="block relative aspect-square overflow-hidden"
        >
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-white px-4 py-2 rounded-lg font-semibold">
                Agotado
              </span>
            </div>
          )}
        </div>

        <CardContent className="pt-4">
          {/* Nombre del producto */}
          <div onClick={() => setIsDialogOpen(true)}>
            <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors mb-2">
              {product.name}
            </h3>
          </div>

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
          disabled={isOutOfStock}
          variant={isOutOfStock ? "outline" : "default"}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? 'No disponible' : 'Agregar al carrito'}
        </Button>
      </CardFooter>
    </Card>

    <ProductDetailDialog
      product={product}
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    />
    </>
  );
}
