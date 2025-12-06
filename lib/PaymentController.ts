import { api } from "./api";
import type {
  CreateCheckoutSessionResponse,
  CreateStripeCheckoutRequest,
  StripePaymentInfo,
} from "@/interfaces/Payment";

/**
 * Controller para operaciones de pago con Stripe
 */
class PaymentController {
  /**
   * POST /payments/stripe/create-checkout-session
   * Crea una sesión de checkout de Stripe desde el carrito
   * 
   * Backend debe:
   * 1. Leer carrito de Redis
   * 2. Validar stock y dirección
   * 3. Crear Stripe Checkout Session con line_items
   * 4. Incluir metadata (user_id, address_id, shipping_cost)
   * 5. Configurar success_url y cancel_url
   * 6. NO crear orden todavía (se crea en webhook)
   * 
   * @param data - Datos del checkout (address_id, shipping_cost)
   * @returns Promise con session_id y client_secret
   */
  static createStripeCheckoutSession = async (
    data: CreateStripeCheckoutRequest
  ): Promise<{
    session_id: string;
    client_secret: string;
    url?: string;
  }> => {
    const response = await api.post<CreateCheckoutSessionResponse>(
      "/payments/stripe/create-checkout-session",
      data
    );
    return response.data.data;
  };

  /**
   * GET /payments/stripe/session/{session_id}
   * Obtiene información de una sesión de pago
   * 
   * Útil para verificar estado en callback pages
   * 
   * @param sessionId - ID de la sesión de Stripe
   * @returns Promise con información del pago
   */
  static getStripeSession = async (
    sessionId: string
  ): Promise<StripePaymentInfo> => {
    const response = await api.get<{
      success: boolean;
      data: StripePaymentInfo;
    }>(`/payments/stripe/session/${sessionId}`);
    return response.data.data;
  };

  /**
   * Helper: Obtener métodos de pago disponibles
   * Útil para mostrar opciones en UI
   */
  static getAvailablePaymentMethods = () => {
    return [
      {
        id: "stripe" as const,
        name: "Tarjeta de Crédito/Débito",
        description: "Pago seguro con Stripe",
        enabled: true,
        icon: "💳",
      },
    ];
  };
}

export default PaymentController;
