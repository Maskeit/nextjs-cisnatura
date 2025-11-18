// ==================== PRODUCT INFO ====================
export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
}

// ==================== CART ITEM ====================
export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: CartProduct;
  subtotal: number;
  created_at: string | null;
  updated_at: string | null;
}

// ==================== CART ====================
export interface Cart {
  id: number;
  user_id: string;
  is_active: boolean;
  items: CartItem[];
  total_items: number;
  total_amount: number;
  created_at: string | null;
}

// ==================== CART SUMMARY ====================
export interface CartSummary {
  total_items: number;
  total_amount: number;
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
  | "VALIDATION_ERROR";

export interface CartApiError {
  success: false;
  status_code: number;
  message: string;
  error: CartErrorCode;
}
