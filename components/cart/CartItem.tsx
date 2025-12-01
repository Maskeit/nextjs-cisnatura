'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartItem as CartItemType } from '@/interfaces/Cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface CartItemProps {
  item: CartItemType;
  onUpdate: (productId: number, quantity: number) => Promise<void>;
  onRemove: (productId: number) => Promise<void>;
}

export default function CartItem({ item, onUpdate, onRemove }: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formattedPrice = formatCurrency(item.product.price);
  const formattedOriginalPrice = item.product.has_discount 
    ? formatCurrency(item.product.original_price) 
    : null;
  const formattedSubtotal = formatCurrency(item.subtotal);
  const formattedSubtotalWithoutDiscount = item.discount_amount > 0
    ? formatCurrency(item.subtotal_without_discount)
    : null;

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
    // Si la cantidad es 1, eliminar el producto en lugar de decrementar
    if (item.quantity === 1) {
      await handleRemove();
      return;
    }

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
    <div className="flex gap-2 md:gap-4 py-3 md:py-4 border-b last:border-b-0">
      {/* Imagen del producto */}
      <Link 
        href={`/productos/${item.product.slug}`}
        className="relative w-16 h-16 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted"
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
          <div className="flex items-start gap-1 md:gap-2 mb-1">
            <Link 
              href={`/productos/${item.product.slug}`}
              className="font-semibold text-sm md:text-lg hover:text-primary transition-colors line-clamp-2 flex-1"
            >
              {item.product.name}
            </Link>
            {item.product.has_discount && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 text-[10px] md:text-xs flex-shrink-0 px-1 md:px-2">
                <Tag className="h-2 w-2 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                <span className="hidden sm:inline">Con descuento</span>
                <span className="sm:hidden">Desc.</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1">
            <p className="text-xs md:text-sm font-semibold text-foreground">
              {formattedPrice} c/u
            </p>
            {formattedOriginalPrice && (
              <p className="text-[10px] md:text-xs text-muted-foreground line-through">
                {formattedOriginalPrice}
              </p>
            )}
          </div>
          {item.product.has_discount && item.product.discount && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {item.product.discount.discount_name} (-{item.product.discount.discount_percentage}%)
            </p>
          )}
        </div>

        {/* Controles de cantidad - Mobile */}
        <div className="flex items-center justify-between mt-2 md:hidden">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={isUpdating || isRemoving}
              className="h-7 w-7"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-semibold w-6 text-center">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={isUpdating || isRemoving || item.quantity >= item.product.stock}
              className="h-7 w-7"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            {formattedSubtotalWithoutDiscount && (
              <p className="text-[10px] text-muted-foreground line-through">
                {formattedSubtotalWithoutDiscount}
              </p>
            )}
            <p className="font-bold text-base text-primary">
              {formattedSubtotal}
            </p>
            {item.discount_amount > 0 && (
              <p className="text-[10px] text-green-600 dark:text-green-400">
                Ahorro: {formatCurrency(item.discount_amount)}
              </p>
            )}
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

        <div className="text-right min-w-[120px]">
          {formattedSubtotalWithoutDiscount && (
            <p className="text-sm text-muted-foreground line-through">
              {formattedSubtotalWithoutDiscount}
            </p>
          )}
          <p className="font-bold text-xl text-primary">
            {formattedSubtotal}
          </p>
          {item.discount_amount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Ahorro: {formatCurrency(item.discount_amount)}
            </p>
          )}
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
      <div className="md:hidden flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isRemoving || isUpdating}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
