// ==================== PRODUCT DISCOUNT INFO ====================
export interface CartProductDiscount {
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  discount_name: string;
  discount_source: 'global' | 'category' | 'product' | 'seasonal';
  savings: number;
  is_active: boolean;
}

// ==================== PRODUCT INFO ====================
export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  has_discount: boolean;
  discount: CartProductDiscount | null;
}

// ==================== CART ITEM ====================
export interface CartItem {
  id?: number;
  cart_id?: number;
  product_id: number;
  quantity: number;
  product: CartProduct;
  subtotal: number;
  subtotal_without_discount: number;
  discount_amount: number;
  created_at?: string | null;
  updated_at?: string | null;
}

// ==================== CART ====================
export interface Cart {
  id?: number;
  user_id: string;
  is_active?: boolean;
  items: CartItem[];
  total_items: number;
  total_amount: number;
  total_discount: number;
  total_without_discount: number;
  shipping_cost: number;
  grand_total: number;
  shipping_info: {
    shipping_price: number;
    is_free: boolean;
    threshold: number | null;
    message: string;
  };
  created_at?: string | null;
}

// ==================== CART SUMMARY ====================
export interface CartSummary {
  total_items: number;
  total_amount: number;
}

// ==================== SHIPPING INFO ====================
export interface ShippingInfo {
  shipping_price: number;
  free_shipping_threshold: number | null;
}

export interface ShippingCalculation {
  shipping_price: number;
  order_total: number;
  free_shipping_threshold: number | null;
  remaining_for_free_shipping: number | null;
}

// ==================== API RESPONSES ====================
export interface CartResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Cart;
}

export interface CartSummaryResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: CartSummary;
}

export interface ShippingInfoResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ShippingInfo;
}

export interface ShippingCalculationResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ShippingCalculation;
}

// ==================== REQUEST BODIES ====================
export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ==================== ERRORS ====================
export type CartErrorCode =
  | "CART_NOT_FOUND"
  | "ITEM_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "INVALID_QUANTITY"
  | "UNAUTHORIZED"
  | "AUTHENTICATION_REQUIRED"
  | "VALIDATION_ERROR";

export interface CartApiError {
  success: false;
  status_code: number;
  message: string;
  error: CartErrorCode;
}

// Estructura con wrapper detail (como viene de la API)
export interface CartApiErrorWrapper {
  detail: CartApiError;
}
