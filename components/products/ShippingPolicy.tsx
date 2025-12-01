'use client';

import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CartController from '@/lib/CartController';
import type { ShippingInfo } from '@/interfaces/Cart';

export default function ShippingPolicy() {
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShippingInfo = async () => {
      try {
        const response = await CartController.getShippingInfo();
        setShippingInfo(response.data);
      } catch (error) {
        console.error('Error fetching shipping info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShippingInfo();
  }, []);

  if (isLoading || !shippingInfo) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  return (
    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
        <span className="font-medium">Envío: </span>
        {shippingInfo.free_shipping_threshold ? (
          <>
            {formatCurrency(shippingInfo.shipping_price)} • 
            <span className="font-semibold text-green-600 dark:text-green-400"> Envío GRATIS</span> en compras mayores a {formatCurrency(shippingInfo.free_shipping_threshold)}
          </>
        ) : (
          <>Costo de envío: {formatCurrency(shippingInfo.shipping_price)}</>
        )}
      </AlertDescription>
    </Alert>
  );
}
