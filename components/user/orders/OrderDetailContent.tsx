"use client"

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import OrdersController from '@/lib/OrdersController';
import { formatDateLong, formatTime } from '@/lib/dateUtils';
import type { Order } from '@/interfaces/Orders';
import { OrderStatus } from '@/interfaces/Orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  DollarSign,
  FileText,
  Truck,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface OrderDetailContentProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailContent({ params }: OrderDetailContentProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.info('Inicia sesión para ver el detalle de la orden');
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadOrderDetail();
    }
  }, [isAuthenticated, authLoading, resolvedParams.id]);

  const loadOrderDetail = async () => {
    setIsLoading(true);
    try {
      const orderData = await OrdersController.getOrderById(Number(resolvedParams.id));
      setOrder(orderData);
    } catch (error: any) {
      console.error('Error al cargar orden:', error);
      
      if (error.response?.status === 401) {
        toast.error('Sesión expirada');
        router.push('/login');
      } else if (error.response?.status === 404) {
        toast.error('Orden no encontrada');
        router.push('/perfil/mis-ordenes');
      } else if (error.response?.status === 403) {
        toast.error('No tienes permisos para ver esta orden');
        router.push('/perfil/mis-ordenes');
      } else {
        toast.error('Error al cargar el detalle de la orden');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    try {
      await OrdersController.cancelOrder(order.id);
      toast.success('Orden cancelada exitosamente. El stock ha sido restaurado.');
      await loadOrderDetail();
    } catch (error: any) {
      console.error('Error al cancelar orden:', error);
      
      if (error.response?.data?.error === 'CANNOT_CANCEL_ORDER') {
        toast.error('No puedes cancelar esta orden. Solo las órdenes pendientes o en espera de pago pueden cancelarse.');
      } else {
        toast.error('Error al cancelar la orden');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  if (authLoading || isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">No se pudo cargar la orden</p>
            <Button onClick={() => router.push('/perfil/mis-ordenes')} className="mt-4">
              Volver a Mis Órdenes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canCancel = OrdersController.canCancelOrder(order);

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/perfil/mis-ordenes')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-zinc-500">
            Orden #{order.id}
          </h1>
          <p className="text-muted-foreground mt-1">
            Detalle completo de tu orden
          </p>
        </div>
        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isCancelling}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Orden
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar orden?</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que deseas cancelar esta orden? El stock de los productos será restaurado automáticamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, mantener orden</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelOrder}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Sí, cancelar orden'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Cards de Información */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={OrdersController.getOrderStatusColor(order.status)} className="text-sm">
              {OrdersController.getOrderStatusLabel(order.status)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {order.status === OrderStatus.PENDING && 'Esperando confirmación'}
              {order.status === OrderStatus.PAYMENT_PENDING && 'Esperando pago'}
              {order.status === OrderStatus.PAID && 'Pago confirmado'}
              {order.status === OrderStatus.PROCESSING && 'Preparando envío'}
              {order.status === OrderStatus.SHIPPED && 'En camino'}
              {order.status === OrderStatus.DELIVERED && 'Entregado'}
              {order.status === OrderStatus.CANCELLED && 'Orden cancelada'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fecha de Orden</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {formatDateLong(order.created_at)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTime(order.created_at)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Método de Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold capitalize">
              {order.payment_method}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {order.payment_status || 'Pendiente'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {OrdersController.formatPrice(order.total)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {order.order_items.length} {order.order_items.length === 1 ? 'producto' : 'productos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Productos de la Orden */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos
          </CardTitle>
          <CardDescription>Lista de productos en esta orden</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.product_sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {OrdersController.formatPrice(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {OrdersController.formatPrice(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          {/* Resumen de Costos */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{OrdersController.formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Envío:</span>
              <span className="font-medium">{OrdersController.formatPrice(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuestos:</span>
              <span className="font-medium">{OrdersController.formatPrice(order.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{OrdersController.formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Envío */}
      {order.tracking_number && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Información de Envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-muted-foreground">Número de Seguimiento</label>
                <p className="font-medium">{order.tracking_number}</p>
              </div>
              {order.shipped_at && (
                <div>
                  <label className="text-sm text-muted-foreground">Fecha de Envío</label>
                  <p className="font-medium">
                    {OrdersController.formatDate(order.shipped_at)}
                  </p>
                </div>
              )}
              {order.delivered_at && (
                <div>
                  <label className="text-sm text-muted-foreground">Fecha de Entrega</label>
                  <p className="font-medium">
                    {OrdersController.formatDate(order.delivered_at)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Fechas Importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de la Orden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Orden Creada</p>
                <p className="text-xs text-muted-foreground">
                  {OrdersController.formatDate(order.created_at)}
                </p>
              </div>
            </div>

            {order.paid_at && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Pago Confirmado</p>
                  <p className="text-xs text-muted-foreground">
                    {OrdersController.formatDate(order.paid_at)}
                  </p>
                </div>
              </div>
            )}

            {order.shipped_at && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Orden Enviada</p>
                  <p className="text-xs text-muted-foreground">
                    {OrdersController.formatDate(order.shipped_at)}
                  </p>
                </div>
              </div>
            )}

            {order.delivered_at && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Orden Entregada</p>
                  <p className="text-xs text-muted-foreground">
                    {OrdersController.formatDate(order.delivered_at)}
                  </p>
                </div>
              </div>
            )}

            {order.status === OrderStatus.CANCELLED && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-sm">Orden Cancelada</p>
                  <p className="text-xs text-muted-foreground">
                    {OrdersController.formatDate(order.updated_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
