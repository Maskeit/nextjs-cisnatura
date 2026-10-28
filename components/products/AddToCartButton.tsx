'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import CartController from '@/lib/CartController';

interface AddToCartButtonProps {
  productId: number;
  stock: number;
}

interface CartError {
  response?: { status?: number; data?: { message?: string } };
}

export default function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isOutOfStock = stock === 0;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      const response = await CartController.addItem({
        product_id: productId,
        quantity,
      });

      if (response.success) {
        toast.success(`${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito`);
        // Disparar evento para actualizar el contador del navbar
        window.dispatchEvent(new Event('cartUpdated'));
        setQuantity(1);
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      const err = error as CartError;

      // Si es 401, redirigir a login
      if (err.response?.status === 401) {
        toast.error('Debes iniciar sesión para agregar productos al carrito');
        router.push('/login');
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Error al agregar el producto al carrito');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      {/* Selector de cantidad */}
      {!isOutOfStock && (
        <div>
          <label className="text-lg font-medium text-foreground mb-3 block">
            Cantidad
          </label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="h-12 w-12"
            >
              -
            </Button>
            <span className="text-2xl font-semibold w-16 text-center">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= stock}
              className="h-12 w-12"
            >
              +
            </Button>
            <span className="text-sm text-muted-foreground ml-4">
              {stock} disponibles
            </span>
          </div>
        </div>
      )}

      {/* Botón de agregar al carrito */}
      <div className="pt-4">
        <Button
          size="lg"
          disabled={isOutOfStock || isAddingToCart}
          onClick={handleAddToCart}
          className="w-full h-16 text-xl"
        >
          {isAddingToCart ? (
            <Loader2 className="h-6 w-6 mr-3 animate-spin" />
          ) : (
            <ShoppingCart className="h-6 w-6 mr-3" />
          )}
          {isOutOfStock ? 'No disponible' : isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
        </Button>
      </div>
    </>
  );
}
