'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Truck } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  totalItems: number;
  totalDiscount?: number;
  totalWithoutDiscount?: number;
  shippingCost: number;
  shippingMessage?: string;
  freeShippingThreshold?: number | null;
  isLoading?: boolean;
}

export default function CartSummary({ 
  subtotal, 
  totalItems, 
  totalDiscount = 0,
  totalWithoutDiscount,
  shippingCost,
  shippingMessage,
  freeShippingThreshold,
  isLoading = false 
}: CartSummaryProps) {
  const router = useRouter();
  const total = subtotal + shippingCost;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formattedSubtotal = formatCurrency(subtotal);
  const formattedShipping = shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost);
  const formattedTotal = formatCurrency(total);

  const remainingForFreeShipping = freeShippingThreshold && subtotal < freeShippingThreshold 
    ? freeShippingThreshold - subtotal 
    : null;
  
  const showFreeShippingProgress = remainingForFreeShipping && remainingForFreeShipping > 0;

  const handleCheckout = () => {
    router.push('/domicilio');
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 md:p-4 lg:p-6 space-y-3 md:space-y-4 lg:sticky lg:top-24">
      <h2 className="text-lg md:text-xl lg:text-2xl font-bold">Resumen del pedido</h2>
      
      <Separator />

      {/* Subtotal sin descuento (si aplica) */}
      {totalDiscount > 0 && totalWithoutDiscount && (
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs md:text-sm text-muted-foreground">
            Subtotal original
          </span>
          <span className="text-xs md:text-sm text-muted-foreground line-through">
            {formatCurrency(totalWithoutDiscount)}
          </span>
        </div>
      )}

      {/* Descuentos aplicados */}
      {totalDiscount > 0 && (
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs md:text-sm lg:text-base text-green-600 dark:text-green-400 font-medium">
            Descuentos aplicados
          </span>
          <span className="font-semibold text-sm md:text-base lg:text-lg text-green-600 dark:text-green-400">
            -{formatCurrency(totalDiscount)}
          </span>
        </div>
      )}

      {/* Subtotal */}
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs md:text-sm lg:text-base text-muted-foreground">
          Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
        </span>
        <span className="font-semibold text-sm md:text-base lg:text-lg">
          {formattedSubtotal}
        </span>
      </div>

      {/* Envío */}
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs md:text-sm lg:text-base text-muted-foreground flex items-center gap-1 md:gap-2">
          <Truck className="h-3 w-3 md:h-4 md:w-4" />
          Envío
        </span>
        <span className={`font-semibold text-sm md:text-base lg:text-lg ${shippingCost === 0 ? 'text-green-600' : ''}`}>
          {formattedShipping}
        </span>
      </div>

      {/* Progreso para envío gratis */}
      {/* {showFreeShippingProgress && (
        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
          <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 text-center">
            ¡Agrega {formatCurrency(remainingForFreeShipping!)} más para obtener envío gratis!
          </p>
        </div>
      )} */}

      {shippingCost === 0 && shippingMessage && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-xs md:text-sm text-green-700 dark:text-green-300 text-center font-medium">
            {shippingMessage}
          </p>
        </div>
      )}

      <Separator />

      {/* Total */}
      <div className="flex justify-between items-center gap-2">
        <span className="text-base md:text-lg lg:text-xl font-bold">Total</span>
        <span className="text-lg md:text-xl lg:text-2xl font-bold text-primary">
          {formattedTotal}
        </span>
      </div>

      {/* Botón de checkout */}
      <Button 
        size="lg" 
        className="w-full text-sm md:text-base lg:text-lg h-10 md:h-12 lg:h-14"
        onClick={handleCheckout}
        disabled={isLoading || totalItems === 0}
      >
        <ShoppingBag className="mr-2 h-4 w-4 md:h-5 md:w-5" />
        Siguiente
      </Button>

      {/* Información adicional */}
      <div className="space-y-2 pt-4">
        {freeShippingThreshold && (
          <p className="text-xs text-muted-foreground text-center">
            Envío gratis en compras mayores a {formatCurrency(freeShippingThreshold)}
          </p>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Los impuestos se calcularán en el siguiente paso
        </p>
      </div>
    </div>
  );
}
