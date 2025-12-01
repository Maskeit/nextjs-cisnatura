'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Package, 
  CreditCard, 
  Mail,
  Home,
  Loader2,
  AlertCircle,
  Calendar,
  Hash,
  ShoppingBag
} from 'lucide-react';
import OrdersController from '@/lib/OrdersController';
import { Order } from '@/interfaces/Orders';
import { formatDate } from '@/lib/dateUtils';
import Image from 'next/image';

export default function OrderConfirmation() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener ID de orden del localStorage
      const orderId = localStorage.getItem('last_order_id');
      
      if (!orderId) {
        setError('No se encontró información de la orden');
        return;
      }

      // Cargar orden
      const orderData = await OrdersController.getOrderById(parseInt(orderId));
      setOrder(orderData);

      // Limpiar localStorage
      localStorage.removeItem('last_order_id');

    } catch (err: any) {
      console.error('Error al cargar orden:', err);
      setError(err.response?.data?.message || 'Error al cargar la orden');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'No se pudo cargar la orden'}</AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => router.push('/')}>
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Mensaje de Confirmación */}
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
          <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-3 md:p-4">
              <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-900 dark:text-green-100">
                ¡Gracias por tu compra!
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-green-700 dark:text-green-300 mt-2">
                Tu orden ha sido recibida y está siendo procesada
              </p>
            </div>
            <Alert className="max-w-md">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Hemos enviado un correo de confirmación con los detalles de tu pedido
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Detalles de la Orden */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-lg md:text-xl">
              <Hash className="h-5 w-5" />
              Detalles de la Orden
            </span>
            <Badge variant="secondary" className="text-base md:text-lg">
              #{order.id}
            </Badge>
          </CardTitle>
          <CardDescription className="flex items-center gap-2 mt-2 text-sm">
            <Calendar className="h-4 w-4" />
            Realizada el {formatDate(order.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Estado de la Orden */}
          <div>
            <h3 className="font-semibold mb-2 text-sm md:text-base">Estado del Pedido</h3>
            <Badge 
              variant={
                order.status === 'pending' ? 'secondary' :
                order.status === 'paid' ? 'default' :
                order.status === 'cancelled' ? 'destructive' :
                'outline'
              }
              className="text-sm"
            >
              {OrdersController.getOrderStatusLabel(order.status)}
            </Badge>
          </div>

          <Separator />

          {/* Productos */}
          <div>
            <h3 className="font-semibold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
              <Package className="h-5 w-5" />
              Productos ({order.order_items.length})
            </h3>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex gap-4 items-start py-3 border-b last:border-b-0">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-2">{item.product_name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${item.unit_price.toFixed(2)} c/u
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      ${item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Resumen de Precios */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Envío</span>
              <span className="font-medium">
                {order.shipping_cost === 0 ? 'Gratis' : `$${order.shipping_cost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA</span>
              <span className="font-medium">${order.tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">
                ${order.total.toFixed(2)} MXN
              </span>
            </div>
          </div>

          <Separator />

          {/* Método de Pago */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
              <CreditCard className="h-5 w-5" />
              Método de Pago
            </h3>
            <p className="text-muted-foreground capitalize">
              {order.payment_method || 'Mercado Pago'}
            </p>
          </div>

          {/* Número de Seguimiento (si existe) */}
          {order.tracking_number && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Número de Seguimiento</h3>
                <p className="text-muted-foreground font-mono">
                  {order.tracking_number}
                </p>
              </div>
            </>
          )}

          {/* Notas (si existen) */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notas</h3>
                <p className="text-sm text-muted-foreground">
                  {order.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                <strong>¿Qué sigue?</strong>
                <br />
                Te notificaremos por correo electrónico cuando tu pedido sea enviado. 
                Puedes rastrear tu orden en cualquier momento desde tu perfil.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button 
                variant="default" 
                size="lg"
                onClick={() => router.push('/')}
                className="w-full sm:w-auto text-sm md:text-base"
              >
                <ShoppingBag className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Seguir comprando
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/perfil/ordenes')}
                className="w-full sm:w-auto text-sm md:text-base"
              >
                <Package className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Ver mis pedidos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
