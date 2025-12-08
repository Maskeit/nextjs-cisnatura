'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrderAdmin, OrderStatus } from '@/interfaces/Orders';
import {
  getAdminOrderById,
  updateOrderStatus,
  deleteOrder,
  sendShippingNotification,
  getOrderStatusLabel,
  getOrderStatusColor,
  formatPrice,
  formatDate,
} from '@/lib/OrdersController';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Truck,
  CheckCircle2,
  XCircle,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderDetailProps {
  orderId: number;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);

  // Form state para actualizar estado
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Form state para notificación de envío
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingUrl, setShippingUrl] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [trackingPdf, setTrackingPdf] = useState<File | null>(null);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminOrderById(orderId);
      setOrder(data);
      setNewStatus(data.status);
      setTrackingNumber(data.tracking_number || '');
      setAdminNotes(data.admin_notes || '');
    } catch (error) {
      console.error('Error al cargar orden:', error);
      toast.error('Error al cargar la orden');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!order) return;

    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, {
        status: newStatus,
        tracking_number: trackingNumber || undefined,
        admin_notes: adminNotes || undefined,
      });

      toast.success('Estado actualizado correctamente');
      setShowStatusDialog(false);
      fetchOrder();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      await deleteOrder(orderId);
      toast.success('Orden eliminada correctamente');
      router.push('/admin/ordenes');
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      toast.error('Error al eliminar la orden');
      setIsUpdating(false);
    }
  };

  const handleSendShippingNotification = async () => {
    if (!order || !trackingNumber || !shippingCarrier) {
      toast.error('Completa los campos requeridos');
      return;
    }

    setIsUpdating(true);
    try {
      await sendShippingNotification(orderId, {
        tracking_number: trackingNumber,
        shipping_carrier: shippingCarrier,
        tracking_url: shippingUrl || undefined,
        admin_notes: shippingNotes || undefined,
        tracking_pdf: trackingPdf || undefined,
      });

      toast.success('Notificación de envío enviada al cliente');
      setShowShippingDialog(false);
      fetchOrder();
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      toast.error('Error al enviar la notificación');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Orden no encontrada</p>
          <Button onClick={() => router.push('/admin/ordenes')} className="mt-4">
            Volver a órdenes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/ordenes')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Orden #{order.id}</h1>
            <p className="text-sm text-muted-foreground">
              Creada el {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={getOrderStatusColor(order.status)} className="text-base px-4 py-1">
            {getOrderStatusLabel(order.status)}
          </Badge>
          <Button onClick={() => setShowStatusDialog(true)}>
            Actualizar Estado
          </Button>
          {order.payment_status === 'paid' && order.status !== OrderStatus.DELIVERED && (
            <Button 
              variant="secondary" 
              onClick={() => {
                setTrackingNumber(order.tracking_number || '');
                setShippingCarrier('');
                setShippingUrl('');
                setShippingNotes('');
                setTrackingPdf(null);
                setShowShippingDialog(true);
              }}
            >
              Notificar Envío
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cliente y Dirección */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Nombre</Label>
              <p className="font-medium">{order.user_name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium">{order.user_email}</p>
            </div>

            <Separator />

            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">
                  Dirección de Envío
                </Label>
                <div className="mt-1 space-y-1">
                  <p className="font-medium">{order.shipping_address.full_name}</p>
                  {order.shipping_address.label && (
                    <Badge variant="outline" className="text-xs">
                      {order.shipping_address.label}
                    </Badge>
                  )}
                  <p className="text-sm">{order.shipping_address.street}</p>
                  <p className="text-sm">
                    {order.shipping_address.city}, {order.shipping_address.state}
                  </p>
                  <p className="text-sm">
                    {order.shipping_address.postal_code}, {order.shipping_address.country}
                  </p>
                  <div className="flex gap-4 pt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Teléfono</Label>
                      <p className="text-sm">📱 {order.shipping_address.phone}</p>
                    </div>
                    {order.shipping_address.rfc && (
                      <div>
                        <Label className="text-xs text-muted-foreground">RFC</Label>
                        <p className="text-sm font-mono">🧾 {order.shipping_address.rfc}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalles de Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Detalles de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Método de Pago</Label>
              <p className="font-medium capitalize">{order.payment_method}</p>
            </div>
            {order.payment_id && (
              <div>
                <Label className="text-xs text-muted-foreground">ID de Pago</Label>
                <p className="font-mono text-sm">{order.payment_id}</p>
              </div>
            )}
            {order.payment_status && (
              <div>
                <Label className="text-xs text-muted-foreground">Estado de Pago</Label>
                <p className="font-medium capitalize">{order.payment_status}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (16%)</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            <Separator />

            {order.tracking_number && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Número de Guía
                </Label>
                <p className="font-mono font-medium">{order.tracking_number}</p>
              </div>
            )}

            {order.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Notas del Cliente</Label>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}

            {order.admin_notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Notas Internas</Label>
                <p className="text-sm">{order.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos ({order.order_items.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{item.product_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    SKU: {item.product_sku}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatPrice(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Creada</span>
              <span className="text-sm font-medium">{formatDate(order.created_at)}</span>
            </div>
            {order.updated_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Actualizada</span>
                <span className="text-sm font-medium">{formatDate(order.updated_at)}</span>
              </div>
            )}
            {order.paid_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pagada</span>
                <span className="text-sm font-medium">{formatDate(order.paid_at)}</span>
              </div>
            )}
            {order.shipped_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Enviada</span>
                <span className="text-sm font-medium">{formatDate(order.shipped_at)}</span>
              </div>
            )}
            {order.delivered_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Entregada</span>
                <span className="text-sm font-medium">{formatDate(order.delivered_at)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para actualizar estado */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Estado de Orden</DialogTitle>
            <DialogDescription>
              Cambia el estado de la orden #{order.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Estado Actual</Label>
              <Badge variant={getOrderStatusColor(order.status)} className="mt-2">
                {getOrderStatusLabel(order.status)}
              </Badge>
            </div>

            <div>
              <Label htmlFor="status">Nuevo Estado</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderStatus.PENDING}>Pendiente</SelectItem>
                  <SelectItem value={OrderStatus.PAYMENT_PENDING}>
                    Pago en Proceso
                  </SelectItem>
                  <SelectItem value={OrderStatus.PAID}>Pagada</SelectItem>
                  <SelectItem value={OrderStatus.PROCESSING}>En Preparación</SelectItem>
                  <SelectItem value={OrderStatus.SHIPPED}>Enviada</SelectItem>
                  <SelectItem value={OrderStatus.DELIVERED}>Entregada</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>Cancelada</SelectItem>
                  <SelectItem value={OrderStatus.REFUNDED}>Reembolsada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tracking">Número de Guía (opcional)</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="FDX1234567890"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas Internas (opcional)</Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notas para el equipo..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La orden #{order.id} será eliminada
              permanentemente y el stock de los productos será restaurado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para notificar envío */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notificar Envío al Cliente</DialogTitle>
            <DialogDescription>
              Envía un correo al cliente con la información de rastreo y guía PDF (opcional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="shipping-tracking">Número de Guía *</Label>
              <Input
                id="shipping-tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="FDX1234567890"
                required
              />
            </div>

            <div>
              <Label htmlFor="shipping-carrier">Paquetería *</Label>
              <Input
                id="shipping-carrier"
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                placeholder="FedEx, DHL, Estafeta, etc."
                required
              />
            </div>

            <div>
              <Label htmlFor="shipping-url">URL de Rastreo (opcional)</Label>
              <Input
                id="shipping-url"
                value={shippingUrl}
                onChange={(e) => setShippingUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>

            <div>
              <Label htmlFor="shipping-notes">Mensaje para el Cliente (opcional)</Label>
              <Textarea
                id="shipping-notes"
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                placeholder="Ej: Tu paquete llegará en 3-5 días hábiles..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="shipping-pdf">Adjuntar Guía PDF (opcional)</Label>
              <Input
                id="shipping-pdf"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type !== 'application/pdf') {
                      toast.error('Solo se permiten archivos PDF');
                      e.target.value = '';
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('El archivo no debe superar 5MB');
                      e.target.value = '';
                      return;
                    }
                    setTrackingPdf(file);
                  }
                }}
              />
              {trackingPdf && (
                <p className="text-sm text-muted-foreground mt-2">
                  📎 {trackingPdf.name} ({(trackingPdf.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 5MB. El PDF se adjuntará al correo del cliente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShippingDialog(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSendShippingNotification} 
              disabled={isUpdating || !trackingNumber || !shippingCarrier}
            >
              {isUpdating ? 'Enviando...' : 'Enviar Notificación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
