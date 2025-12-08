import { Address } from "./Address";

// ==================== ENUMS ====================
export enum OrderStatus {
  PENDING = "pending",
  PAYMENT_PENDING = "payment_pending",
  PAID = "paid",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  OPENPAY = "openpay",
  CASH = "cash",
  TRANSFER = "transfer",
}

// ==================== ORDER ITEM ====================
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// ==================== ORDER ====================
export interface Order {
  id: number;
  user_id: string;
  address_id: number;
  payment_method: string;
  payment_id: string | null;
  payment_status: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  notes: string | null;
  tracking_number: string | null;
  order_items: OrderItem[];
  created_at: string;
  updated_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

// ==================== ORDER WITH ADMIN DATA ====================
export interface OrderAdmin extends Order {
  user_email: string;
  user_name: string;
  admin_notes: string | null;
  shipping_address: Address;
}

// ==================== ORDER SUMMARY (for lists) ====================
export interface OrderSummary {
  id: number;
  status: OrderStatus;
  payment_method: string;
  total: number;
  items_count: number;
  created_at: string;
}

export interface OrderSummaryAdmin extends OrderSummary {
  user_email: string;
  user_name: string;
}

// ==================== ORDER LIST ====================
export interface OrderList {
  orders: OrderSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface OrderListAdmin {
  orders: OrderSummaryAdmin[];
  total: number;
  page: number;
  page_size: number;
}

// ==================== ORDER STATS ====================
export interface TopProduct {
  product_id: number;
  product_name: string;
  product_sku: string;
  total_sold: number;
  total_revenue: number;
}

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
  revenue_this_year: number;
  top_products: TopProduct[];
}

// ==================== API RESPONSES ====================
export interface OrderResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Order;
}

export interface CreateOrderResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Order;
}

export interface CreatePaymentResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    checkout_url: string;
    sandbox_url: string;
    payment_id: string;
    amount: number;
    currency: string;
  };
}

export interface CreatePaymentFromCartResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    preference_id: string;
    checkout_url: string;
    sandbox_url: string;
  };
}

export interface OrderAdminResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: OrderAdmin;
}

export interface OrderListResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: OrderList;
}

export interface OrderListAdminResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: OrderListAdmin;
}

export interface OrderStatsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: OrderStats;
}

export interface OrderDeleteResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: null;
}

// ==================== REQUEST BODIES ====================
export interface CreateOrderRequest {
  address_id: number;
  payment_method?: string;
  notes?: string;
  shipping_cost?: number;  // Costo de envío calculado por el frontend
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  admin_notes?: string;
  tracking_number?: string;
}

export interface ShippingNotificationRequest {
  tracking_number: string;
  shipping_carrier: string;
  tracking_url?: string;
  admin_notes?: string;
  tracking_pdf?: File;
}

// ==================== QUERY PARAMS ====================
export interface GetOrdersParams {
  skip?: number;
  limit?: number;
}

export interface GetAdminOrdersParams {
  skip?: number;
  limit?: number;
  status?: OrderStatus;
  payment_method?: string;
  user_email?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ==================== ERRORS ====================
export type OrderErrorCode =
  | "ORDER_NOT_FOUND"
  | "EMPTY_CART"
  | "ADDRESS_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "CANNOT_CANCEL_ORDER"
  | "UNAUTHORIZED"
  | "AUTHENTICATION_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export interface OrderApiError {
  success: false;
  status_code: number;
  message: string;
  error: OrderErrorCode;
}

// Estructura con wrapper detail (como viene de la API)
export interface OrderApiErrorWrapper {
  detail: OrderApiError;
}
