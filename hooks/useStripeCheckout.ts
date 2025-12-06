"use client";

import { useState, useCallback } from "react";
import PaymentController from "@/lib/PaymentController";
import type { CreateStripeCheckoutRequest } from "@/interfaces/Payment";

/**
 * Hook personalizado para manejar el flujo de Stripe Checkout
 * 
 * Gestiona:
 * - Creación de sesión de checkout
 * - Redirección a Stripe
 * - Estados de carga y error
 * - Obtención de información de sesión
 * 
 * Uso:
 * ```tsx
 * const { createCheckout, isLoading, error } = useStripeCheckout();
 * 
 * const handlePay = async () => {
 *   const session = await createCheckout({
 *     address_id: 1,
 *     payment_method: "stripe"
 *   });
 *   
 *   if (session?.url) {
 *     window.location.href = session.url;
 *   }
 * };
 * ```
 */
export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  /**
   * Crea una sesión de Stripe Checkout desde el carrito actual
   * 
   * @param data - Datos del checkout (address_id, notes, etc.)
   * @returns Datos de la sesión creada con url para redireccionar
   */
  const createCheckout = useCallback(
    async (data: CreateStripeCheckoutRequest) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await PaymentController.createStripeCheckoutSession(
          data
        );

        setSessionId(response.session_id);

        return {
          session_id: response.session_id,
          client_secret: response.client_secret,
          url: response.url,
        };
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Error al crear la sesión de checkout";

        setError(errorMessage);
        console.error("Error creating Stripe checkout:", err);

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Obtiene información de una sesión de Stripe
   * Útil para verificar el estado después del pago
   * 
   * @param sessionId - ID de la sesión de Stripe
   * @returns Información del pago
   */
  const getSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionInfo = await PaymentController.getStripeSession(sessionId);
      return sessionInfo;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Error al obtener información de la sesión";

      setError(errorMessage);
      console.error("Error fetching Stripe session:", err);

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reinicia el estado del hook
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setSessionId(null);
  }, []);

  return {
    // Estado
    isLoading,
    error,
    sessionId,

    // Métodos
    createCheckout,
    getSession,
    reset,
  };
}

/**
 * Hook para verificar el estado de una sesión desde la URL
 * Útil en páginas de éxito/cancelación
 * 
 * Uso:
 * ```tsx
 * // En /checkout/stripe/success
 * const { session, isLoading, error } = useStripeSession();
 * 
 * if (session?.payment_status === "paid") {
 *   // Pago exitoso
 * }
 * ```
 */
export function useStripeSession() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga la información de la sesión desde el ID
   */
  const loadSession = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      setError("No se proporcionó un session_id");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionInfo = await PaymentController.getStripeSession(sessionId);
      setSession(sessionInfo);
      return sessionInfo;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Error al cargar la sesión";

      setError(errorMessage);
      console.error("Error loading Stripe session:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    session,
    isLoading,
    error,
    loadSession,
  };
}
