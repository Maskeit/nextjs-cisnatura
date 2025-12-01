'use client';

import { Product } from '@/interfaces/Products';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';

interface ProductDetailDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailDialog({
  product,
  open,
  onOpenChange,
}: ProductDetailDialogProps) {
  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(product.price);

  const isOutOfStock = product.stock === 0;

  const imageUrl = product.image_url
    ? `${process.env.NEXT_PUBLIC_API_URL}${product.image_url}`
    : '/placeholder.png';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden">
        <div className="grid md:grid-cols-[400px_1fr] h-full max-h-[90vh]">
          {/* Columna izquierda - Imagen */}
          <div className="relative bg-muted min-h-[400px] md:min-h-[600px]">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="400px"
              unoptimized
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-destructive text-white px-6 py-3 rounded-lg font-semibold text-lg">
                  Agotado
                </span>
              </div>
            )}
            {/* Badge de descuento */}
            {product.has_discount && product.discount && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-5 py-2 rounded-full font-bold text-xl shadow-lg">
                -{product.discount.discount_percentage}%
              </div>
            )}
          </div>

          {/* Columna derecha - Detalles */}
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header con título */}
            <DialogHeader className="px-8 pt-8 pb-6 border-b shrink-0">
              <DialogTitle className="text-3xl font-bold leading-tight pr-8">
                {product.name}
              </DialogTitle>
              {/* Stock badge */}
              <div className="mt-4">
                {isOutOfStock ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-destructive/10 text-destructive">
                    Sin stock
                  </span>
                ) : product.stock < 10 ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    ¡Solo quedan {product.stock}!
                  </span>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                    Disponible
                  </span>
                )}
              </div>
            </DialogHeader>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Descripción */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Descripción
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {product.description || 'No hay descripción disponible para este producto.'}
                </p>
              </div>

              {/* Información adicional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Detalles del producto
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-base text-muted-foreground">SKU</span>
                    <span className="text-base font-medium">{product.slug}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-base text-muted-foreground">Stock disponible</span>
                    <span className="text-base font-medium">{product.stock} unidades</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer fijo con precio y botón */}
            <DialogFooter className="px-8 py-6 border-t bg-muted/30 flex-row items-center justify-between space-x-0 shrink-0">
              <div className="flex flex-col">
                <span className="text-base text-muted-foreground mb-1">Precio</span>
                {product.has_discount && product.discount ? (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">
                        {formattedPrice}
                      </span>
                      <span className="text-xl text-muted-foreground line-through">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(product.discount.original_price)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {product.discount.discount_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-4xl font-bold text-primary">
                    {formattedPrice}
                  </span>
                )}
              </div>
              <Button
                size="lg"
                disabled={isOutOfStock}
                variant={isOutOfStock ? 'outline' : 'default'}
                className="min-w-[220px] h-14 text-lg"
              >
                <ShoppingCart className="h-6 w-6 mr-2" />
                {isOutOfStock ? 'No disponible' : 'Agregar al carrito'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
