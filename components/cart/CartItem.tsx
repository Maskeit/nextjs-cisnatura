'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartItem as CartItemType } from '@/interfaces/Cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CartItemProps {
  item: CartItemType;
  onUpdate: (productId: number, quantity: number) => Promise<void>;
  onRemove: (productId: number) => Promise<void>;
}

export default function CartItem({ item, onUpdate, onRemove }: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(item.product.price);

  const formattedSubtotal = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(item.subtotal);

  const imageUrl = item.product.image_url
    ? `${process.env.NEXT_PUBLIC_API_URL}${item.product.image_url}`
    : '/placeholder.png';

  const handleIncrement = async () => {
    if (item.quantity >= item.product.stock) {
      toast.error('No hay suficiente stock disponible');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(item.product_id, item.quantity + 1);
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(item.product_id, item.quantity - 1);
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.product_id);
      toast.success('Producto eliminado del carrito');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.error('Error al eliminar el producto');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Imagen del producto */}
      <Link 
        href={`/productos/${item.product.slug}`}
        className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted"
      >
        <Image
          src={imageUrl}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="96px"
          unoptimized={!!item.product.image_url}
        />
      </Link>

      {/* Información del producto */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link 
            href={`/productos/${item.product.slug}`}
            className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2"
          >
            {item.product.name}
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {formattedPrice} c/u
          </p>
        </div>

        {/* Controles de cantidad - Mobile */}
        <div className="flex items-center justify-between mt-2 md:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={isUpdating || isRemoving}
              className="h-8 w-8"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-base font-semibold w-8 text-center">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={isUpdating || isRemoving || item.quantity >= item.product.stock}
              className="h-8 w-8"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            <p className="font-bold text-lg text-primary">
              {formattedSubtotal}
            </p>
          </div>
        </div>
      </div>

      {/* Controles de cantidad - Desktop */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={isUpdating || isRemoving}
            className="h-9 w-9"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-10 text-center">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={isUpdating || isRemoving || item.quantity >= item.product.stock}
            className="h-9 w-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-right min-w-[100px]">
          <p className="font-bold text-xl text-primary">
            {formattedSubtotal}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isRemoving || isUpdating}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Eliminar del carrito"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Botón eliminar - Mobile */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isRemoving || isUpdating}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
