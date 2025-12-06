// ==================== STRIPE INTERFACES ====================

/**
 * Respuesta al crear un Checkout Session
 */
export interface CreateCheckoutSessionResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    session_id: string;
    client_secret: string;
    url?: string;  // URL del checkout hosteado (si usas redirect)
  };
}

/**
 * Request para crear checkout session desde el carrito
 */
export interface CreateStripeCheckoutRequest {
  address_id: number;
  payment_method?: string;  // Siempre será "stripe"
  shipping_cost?: number;    // Costo de envío calculado
  notes?: string;            // Notas opcionales
}

/**
 * Información de pago completado
 */
export interface StripePaymentInfo {
  session_id: string;
  payment_intent: string;
  payment_status: string;
  amount_total: number;
  currency: string;
  customer_email?: string;
}

/**
 * Respuesta del webhook de Stripe
 */
export interface StripeWebhookData {
  type: string;  // checkout.session.completed, payment_intent.succeeded, etc
  data: {
    object: {
      id: string;
      payment_status: string;
      metadata: {
        user_id?: string;
        address_id?: string;
        order_id?: string;
      };
    };
  };
}

// ==================== PAYMENT METHOD TYPES ====================

export type PaymentProvider = 'stripe';

export interface PaymentMethod {
  id: PaymentProvider;
  name: string;
  description: string;
  enabled: boolean;
  icon?: string;
}

// ==================== ERRORS ====================

export type StripeErrorCode =
  | "INVALID_SESSION"
  | "PAYMENT_FAILED"
  | "SESSION_EXPIRED"
  | "INVALID_AMOUNT"
  | "CART_EMPTY"
  | "ADDRESS_NOT_FOUND";

export interface StripeApiError {
  success: false;
  status_code: number;
  message: string;
  error: StripeErrorCode;
}
