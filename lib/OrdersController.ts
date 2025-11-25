import { api } from "./api";
import {
  Order,
  OrderAdmin,
  OrderList,
  OrderListAdmin,
  OrderStats,
  OrderResponse,
  OrderAdminResponse,
  OrderListResponse,
  OrderListAdminResponse,
  OrderStatsResponse,
  OrderDeleteResponse,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  GetOrdersParams,
  GetAdminOrdersParams,
  OrderStatus,
} from "@/interfaces/Orders";

// ==================== USER ENDPOINTS ====================

/**
 * POST /orders - Crear orden desde el carrito
 * Valida stock, crea orden, reduce inventario y limpia carrito
 */
export const createOrder = async (
  data: CreateOrderRequest
): Promise<Order> => {
  const response = await api.post<OrderResponse>("/orders/", data);
  return response.data.data;
};

/**
 * GET /orders - Listar mis órdenes
 */
export const getOrders = async (
  params?: GetOrdersParams
): Promise<OrderList> => {
  const response = await api.get<OrderListResponse>("/orders/", { params });
  return response.data.data;
};

/**
 * GET /orders/{order_id} - Detalle de una orden
 */
export const getOrderById = async (orderId: number): Promise<Order> => {
  const response = await api.get<OrderResponse>(`/orders/${orderId}`);
  return response.data.data;
};

/**
 * POST /orders/{order_id}/cancel - Cancelar orden
 * Solo disponible para órdenes en estado pending o payment_pending
 * Restaura automáticamente el stock
 */
export const cancelOrder = async (orderId: number): Promise<Order> => {
  const response = await api.post<OrderResponse>(`/orders/${orderId}/cancel`);
  return response.data.data;
};

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /admin/orders - Listar todas las órdenes (admin)
 * Incluye filtros avanzados
 */
export const getAdminOrders = async (
  params?: GetAdminOrdersParams
): Promise<OrderListAdmin> => {
  const response = await api.get<OrderListAdminResponse>("/admin/orders/", {
    params,
  });
  return response.data.data;
};

/**
 * GET /admin/orders/{order_id} - Detalle completo de orden (admin)
 * Incluye información adicional: user_email, user_name, shipping_address, admin_notes
 */
export const getAdminOrderById = async (orderId: number): Promise<OrderAdmin> => {
  const response = await api.get<OrderAdminResponse>(`/admin/orders/${orderId}`);
  return response.data.data;
};

/**
 * PATCH /admin/orders/{order_id}/status - Actualizar estado de orden (admin)
 * Actualiza timestamps automáticamente según el estado
 */
export const updateOrderStatus = async (
  orderId: number,
  data: UpdateOrderStatusRequest
): Promise<OrderAdmin> => {
  const response = await api.patch<OrderAdminResponse>(
    `/admin/orders/${orderId}/status`,
    data
  );
  return response.data.data;
};

/**
 * GET /admin/orders/stats/summary - Estadísticas y ganancias (admin)
 * Incluye: total órdenes, ganancias por período, top productos
 */
export const getOrderStats = async (): Promise<OrderStats> => {
  const response = await api.get<OrderStatsResponse>(
    "/admin/orders/stats/summary"
  );
  return response.data.data;
};

/**
 * DELETE /admin/orders/{order_id} - Eliminar orden (admin)
 * Restaura automáticamente el stock
 * Solo para casos excepcionales
 */
export const deleteOrder = async (orderId: number): Promise<void> => {
  await api.delete<OrderDeleteResponse>(`/admin/orders/${orderId}`);
};

// ==================== HELPER METHODS ====================

/**
 * Helper: Obtener órdenes filtradas por estado
 */
export const getOrdersByStatus = async (
  status: OrderStatus,
  params?: GetOrdersParams
): Promise<OrderList> => {
  // Para usuarios normales, esto no está soportado en el endpoint de usuario
  // Solo se puede hacer con el endpoint de admin
  throw new Error("Use getAdminOrders with status filter for admin users");
};

/**
 * Helper: Verificar si una orden puede ser cancelada
 */
export const canCancelOrder = (order: Order): boolean => {
  return (
    order.status === OrderStatus.PENDING ||
    order.status === OrderStatus.PAYMENT_PENDING
  );
};

/**
 * Helper: Obtener el nombre legible del estado
 */
export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Pendiente",
    [OrderStatus.PAYMENT_PENDING]: "Pago en Proceso",
    [OrderStatus.PAID]: "Pagada",
    [OrderStatus.PROCESSING]: "En Preparación",
    [OrderStatus.SHIPPED]: "Enviada",
    [OrderStatus.DELIVERED]: "Entregada",
    [OrderStatus.CANCELLED]: "Cancelada",
    [OrderStatus.REFUNDED]: "Reembolsada",
  };
  return labels[status] || status;
};

/**
 * Helper: Obtener el color del badge según el estado
 */
export const getOrderStatusColor = (
  status: OrderStatus
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case OrderStatus.PENDING:
    case OrderStatus.PAYMENT_PENDING:
      return "secondary";
    case OrderStatus.PAID:
    case OrderStatus.PROCESSING:
    case OrderStatus.SHIPPED:
      return "default";
    case OrderStatus.DELIVERED:
      return "outline";
    case OrderStatus.CANCELLED:
    case OrderStatus.REFUNDED:
      return "destructive";
    default:
      return "default";
  }
};

/**
 * Helper: Formatear precio en MXN
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

/**
 * Helper: Formatear fecha
 */
export const formatDate = (date: string | null): string => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export default {
  // User methods
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,

  // Admin methods
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  getOrderStats,
  deleteOrder,

  // Helpers
  canCancelOrder,
  getOrderStatusLabel,
  getOrderStatusColor,
  formatPrice,
  formatDate,
};
