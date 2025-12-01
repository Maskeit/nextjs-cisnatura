'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Package, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import CartController from '@/lib/CartController';
import AddressController from '@/lib/AddressController';
import OrdersController from '@/lib/OrdersController';
import { Cart, ShippingCalculation } from '@/interfaces/Cart';
import { Address } from '@/interfaces/Address';
import Image from 'next/image';

export default function OrderSummary() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [shippingCalc, setShippingCalc] = useState<ShippingCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener ID de dirección seleccionada del localStorage
      const selectedAddressId = localStorage.getItem('selected_address_id');
      
      if (!selectedAddressId) {
        setError('No se ha seleccionado una dirección de envío');
        return;
      }

      // Cargar carrito y dirección en paralelo
      const [cartResponse, addressResponse] = await Promise.all([
        CartController.getCart(),
        AddressController.getAddressById(parseInt(selectedAddressId))
      ]);

      if (!cartResponse.success || !cartResponse.data.items.length) {
        setError('Tu carrito está vacío');
        return;
      }

      if (!addressResponse.success) {
        setError('No se pudo cargar la dirección de envío');
        return;
      }

      setCart(cartResponse.data);
      setAddress(addressResponse.data);

      // Calcular costo de envío
      try {
        const shippingResponse = await CartController.calculateShipping(cartResponse.data.total_amount);
        setShippingCalc(shippingResponse.data);
      } catch (shippingErr) {
        console.error('Error calculando envío:', shippingErr);
        // Fallback si falla el cálculo
        setShippingCalc({
          shipping_price: 250,
          order_total: cartResponse.data.total_amount,
          free_shipping_threshold: null,
          remaining_for_free_shipping: null,
        });
      }

    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!address) {
      toast.error('No hay dirección de envío seleccionada');
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Crear la orden
      const order = await OrdersController.createOrder({
        address_id: address.id,
        payment_method: 'mercadopago', // Por defecto Mercado Pago
        notes: undefined
      });

      toast.success('¡Orden creada exitosamente!');
      
      // Guardar ID de orden para la página de confirmación
      localStorage.setItem('last_order_id', order.id.toString());
      
      // Limpiar dirección seleccionada
      localStorage.removeItem('selected_address_id');

      // Aquí iría la integración con Mercado Pago
      // Por ahora, redirigir directamente a confirmación
      router.push('/checkout/confirmacion');

    } catch (err: any) {
      console.error('Error al crear orden:', err);
      const errorMessage = err.response?.data?.message || 'Error al crear la orden';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => router.push('/carrito')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al carrito
          </Button>
          <Button variant="outline" onClick={() => router.push('/domicilio')}>
            Seleccionar dirección
          </Button>
        </div>
      </div>
    );
  }

  if (!cart || !address) {
    return null;
  }

  const shippingCost: number = shippingCalc?.shipping_price || 0;  
  const total: number = cart.total_amount + shippingCost;

  return (
    <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
      {/* Columna izquierda - Productos y Dirección */}
      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        {/* Dirección de Envío */}
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <MapPin className="h-5 w-5" />
                Dirección de Envío
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <div className="space-y-1 md:space-y-2">
                <p className="font-medium text-sm md:text-base">{address.full_name}</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {address.street}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {address.city}, {address.state}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {address.postal_code}, {address.country}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Tel: {address.phone}
                </p>
                {address.is_default && (
                  <Badge variant="secondary" className="mt-2">Predeterminada</Badge>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Productos */}
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Package className="h-5 w-5" />
                Productos ({cart.total_items})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <div className="space-y-2 md:space-y-4">
                {cart.items.map((item) => {
                  const imageUrl = item.product.image_url
                    ? `${process.env.NEXT_PUBLIC_API_URL}${item.product.image_url}`
                    : '/placeholder.png';
                  
                  return (
                    <div key={`cart-item-${item.id}`} className="flex gap-2 md:gap-4 py-3 md:py-4 border-b last:border-b-0">
                      <Link 
                        href={`/productos/${item.product.slug}`}
                        className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted"
                      >
                        <Image
                          src={imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 64px, 80px"
                          unoptimized={!!item.product.image_url}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/productos/${item.product.slug}`}
                          className="font-semibold text-sm md:text-base hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                          ${item.product.price.toFixed(2)} c/u
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-base md:text-lg text-primary">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columna derecha - Resumen de Pago */}
      <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <CreditCard className="h-5 w-5" />
                Resumen de Pago
              </CardTitle>
              <CardDescription className="text-sm">
                Detalles del total a pagar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-3 md:p-4 lg:p-6">
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${cart.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : ''}`}>
                    {shippingCost === 0 ? '¡Gratis! 🎉' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {shippingCalc?.free_shipping_threshold && shippingCost === 0 && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-2">
                    <p className="text-xs text-green-700 dark:text-green-300 text-center font-medium">
                      ¡Tienes envío gratis en esta compra!
                    </p>
                  </div>
                )}
                {/* <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div> */}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-base md:text-lg font-semibold">Total</span>
                  <span className="text-base md:text-lg font-bold text-primary">
                    ${total.toFixed(2)} MXN
                  </span>
                </div>
              </div>

              <Alert className="py-2">
                <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                <AlertDescription className="text-[10px] md:text-xs">
                  El pago se procesará de forma segura a través de Mercado Pago
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 md:gap-3 p-3 md:p-4 lg:p-6">
              <Button 
                className="w-full text-sm md:text-base" 
                size="lg"
                onClick={handleCreateOrder}
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pagar con Mercado Pago
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-sm md:text-base"
                onClick={() => router.push('/carrito')}
                disabled={isCreatingOrder}
              >
                Volver al carrito
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
