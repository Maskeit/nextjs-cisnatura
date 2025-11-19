'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  totalItems: number;
  isLoading?: boolean;
}

const SHIPPING_COST = 250;

export default function CartSummary({ subtotal, totalItems, isLoading = false }: CartSummaryProps) {
  const router = useRouter();
  const total = subtotal + SHIPPING_COST;

  const formattedSubtotal = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(subtotal);

  const formattedShipping = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(SHIPPING_COST);

  const formattedTotal = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(total);

  const handleCheckout = () => {
    router.push('/domicilio');
  };

  return (
    <div className="bg-muted/30 rounded-lg p-6 space-y-4 sticky top-24">
      <h2 className="text-2xl font-bold">Resumen del pedido</h2>
      
      <Separator />

      {/* Subtotal */}
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">
          Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
        </span>
        <span className="font-semibold text-lg">
          {formattedSubtotal}
        </span>
      </div>

      {/* Envío */}
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Envío</span>
        <span className="font-semibold text-lg">
          {formattedShipping}
        </span>
      </div>

      <Separator />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold">Total</span>
        <span className="text-2xl font-bold text-primary">
          {formattedTotal}
        </span>
      </div>

      {/* Botón de checkout */}
      <Button 
        size="lg" 
        className="w-full text-lg h-14"
        onClick={handleCheckout}
        disabled={isLoading || totalItems === 0}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        Siguiente
      </Button>

      {/* Información adicional */}
      <div className="space-y-2 pt-4">
        <p className="text-xs text-muted-foreground text-center">
          El envío puede variar según tu ubicación
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Los impuestos se calcularán en el siguiente paso
        </p>
      </div>
    </div>
  );
}
