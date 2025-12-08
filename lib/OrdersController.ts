import { api } from "./api";
import {
  Order,
  OrderAdmin,
  OrderList,
  OrderListAdmin,
  OrderStats,
  OrderResponse,
  CreateOrderResponse,
  CreatePaymentResponse,
  CreatePaymentFromCartResponse,
  OrderAdminResponse,
  OrderListResponse,
  OrderListAdminResponse,
  OrderStatsResponse,
  OrderDeleteResponse,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  ShippingNotificationRequest,
  GetOrdersParams,
  GetAdminOrdersParams,
  OrderStatus,
} from "@/interfaces/Orders";

// ==================== USER ENDPOINTS ====================

/**
 * POST /payments/create-from-cart - NUEVO FLUJO: Crear pago directamente desde carrito
 * 
 * FLUJO COMPLETO:
 * 1. Usuario agrega productos: POST /cart/add { product_id, quantity }
 * 2. Backend guarda en Redis por user_id (del JWT)
 * 3. Usuario verifica carrito: GET /cart
 * 4. Usuario crea pago: POST /payments/create-from-cart { address_id, payment_method }
 * 5. Backend:
 *    - Lee carrito Redis
 *    - Valida stock y dirección
 *    - Crea preferencia con items detallados
 *    - NO crea orden todavía
 *    - NO limpia carrito
 * 6. Usuario paga en
 * 7. Webhook recibe confirmación → /payments/webhook
 * 8. Si payment_status == "approved":
 *    - Crea la orden en PostgreSQL
 *    - Reduce stock
 *    - Limpia carrito Redis
 * 
 * ✅ Ventajas:
 * - Precio correcto: Items detallados se envían a MP
 * - Carrito intacto: Solo se limpia cuando webhook confirma pago
 * - Orden solo si paga: Orden se crea después del pago confirmado
 * - Una orden por pago: Verifica que no exista orden con ese payment_id
 */
export const createPaymentFromCart = async (
  data: CreateOrderRequest
): Promise<{
  preference_id: string;
  checkout_url: string;
  sandbox_url: string;
}> => {
  const response = await api.post<CreatePaymentFromCartResponse>(
    "/payments/create-from-cart",
    data
  );
  return response.data.data;
};

/**
 * POST /orders/ - Crear orden desde el carrito Redis (LEGACY)
 * 
 * ⚠️ DEPRECADO: Usar createPaymentFromCart en su lugar
 * Este método crea la orden ANTES del pago, lo que puede causar:
 * - Órdenes sin pago
 * - Stock reducido sin confirmación
 * - Carrito limpiado prematuramente
 */
export const createOrder = async (
  data: CreateOrderRequest
): Promise<Order> => {
  const response = await api.post<CreateOrderResponse>("/orders/", data);
  return response.data.data;
};

/**
 * POST /payments/create/{order_id} - Crear pago con Mercado Pago (LEGACY)
 * 
 * ⚠️ DEPRECADO: Usar createPaymentFromCart en su lugar
 * Genera la preferencia y retorna las URLs de checkout
 */
export const createPayment = async (
  orderId: number
): Promise<{
  checkout_url: string;
  sandbox_url: string;
  payment_id: string;
  amount: number;
  currency: string;
}> => {
  const response = await api.post<CreatePaymentResponse>(
    `/payments/create/${orderId}`
  );
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

/**
 * POST /admin/orders/{order_id}/notify-shipping - Notificar envío al cliente (admin)
 * Envía correo con información de rastreo y guía PDF opcional
 */
export const sendShippingNotification = async (
  orderId: number,
  data: ShippingNotificationRequest
): Promise<void> => {
  const formData = new FormData();
  formData.append('tracking_number', data.tracking_number);
  formData.append('shipping_carrier', data.shipping_carrier);
  
  if (data.tracking_url) {
    formData.append('tracking_url', data.tracking_url);
  }
  
  if (data.admin_notes) {
    formData.append('admin_notes', data.admin_notes);
  }
  
  if (data.tracking_pdf) {
    formData.append('tracking_pdf', data.tracking_pdf);
  }
  
  await api.post(`/admin/orders/${orderId}/notify-shipping`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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
  // User methods (NEW FLOW)
  createPaymentFromCart,
  
  // User methods (LEGACY)
  createOrder,
  createPayment,
  getOrders,
  getOrderById,
  cancelOrder,

  // Admin methods
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  getOrderStats,
  deleteOrder,
  sendShippingNotification,

  // Helpers
  canCancelOrder,
  getOrderStatusLabel,
  getOrderStatusColor,
  formatPrice,
  formatDate,
};
