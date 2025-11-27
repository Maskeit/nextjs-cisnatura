'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrdersController from '@/lib/OrdersController';
import { formatDateTime } from '@/lib/dateUtils';
import type { OrderSummary } from '@/interfaces/Orders';
import { OrderStatus } from '@/interfaces/Orders';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Package,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  ShoppingBag,
} from 'lucide-react';

interface OrdersTableProps {
  initialPage?: number;
  initialLimit?: number;
}

export default function OrdersTable({ initialPage = 1, initialLimit = 10 }: OrdersTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [currentPage, limit]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * limit;
      const response = await OrdersController.getOrders({ skip, limit });
      
      setOrders(response.orders);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (error: any) {
      console.error('Error al cargar órdenes:', error);
      
      if (error.response?.status === 401) {
        toast.error('Sesión expirada');
        router.push('/login');
      } else {
        toast.error('Error al cargar tus órdenes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
    toast.success('Lista actualizada');
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/perfil/mis-ordenes/${orderId}`);
  };

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-4">
      {/* Header con info y acciones */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total > 0 ? (
            <p>Mostrando {orders.length} de {total} órdenes</p>
          ) : (
            <p>No tienes órdenes</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Orden</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead className="text-right">Productos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton Loading
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                // Empty State
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium">No tienes órdenes aún</p>
                      <p className="text-sm text-muted-foreground">
                        Tus compras aparecerán aquí
                      </p>
                      <Button 
                        onClick={() => router.push('/')}
                        className="mt-4"
                      >
                        Empezar a Comprar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data Rows
                orders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewOrder(order.id)}
                  >
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      {formatDateTime(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={OrdersController.getOrderStatusColor(order.status)}>
                        {OrdersController.getOrderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {order.payment_method}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.items_count} {order.items_count === 1 ? 'producto' : 'productos'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {OrdersController.formatPrice(order.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!hasPrev || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!hasNext || isLoading}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
