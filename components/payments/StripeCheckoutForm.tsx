"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { toast } from "sonner";

interface StripeCheckoutFormProps {
  addressId: number;
  shippingCost: number;
  notes?: string;
  onError?: (error: string) => void;
}

/**
 * Componente para manejar el checkout con Stripe Hosted Checkout
 * 
 * Flujo:
 * 1. Al montar, crea sesión de checkout en el backend
 * 2. Redirige a Stripe Checkout (hosted page)
 * 3. Usuario completa el pago en Stripe
 * 4. Stripe redirige de vuelta a /checkout/stripe/success
 * 5. Webhook del backend recibe confirmación y crea la orden
 */
export default function StripeCheckoutForm({
  addressId,
  shippingCost,
  notes,
  onError,
}: StripeCheckoutFormProps) {
  const router = useRouter();
  const { createCheckout, isLoading, error } = useStripeCheckout();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Crear checkout session automáticamente al montar
    handleCreateCheckout();
  }, []);

  const handleCreateCheckout = async () => {
    try {
      const session = await createCheckout({
        address_id: addressId,
        payment_method: "stripe",
        shipping_cost: shippingCost,
        notes: notes || undefined,
      });

      if (session?.url) {
        // Redirigir a Stripe Checkout
        setRedirecting(true);
        toast.success("Redirigiendo a Stripe...");
        
        // Esperar un momento para que el usuario vea el mensaje
        setTimeout(() => {
          window.location.href = session.url!;
        }, 500);
      } else if (error) {
        onError?.(error);
      }
    } catch (err: any) {
      console.error("Error creating checkout:", err);
      const errorMessage = err.message || "Error al crear la sesión de checkout";
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading || redirecting) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">
                {redirecting ? "Redirigiendo a Stripe..." : "Preparando el checkout..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {redirecting 
                  ? "Serás redirigido al checkout de Stripe en un momento"
                  : "Por favor espera mientras configuramos tu pago"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error al crear el checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button
              onClick={handleCreateCheckout}
              className="flex-1"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Este estado no debería mostrarse normalmente
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Sesión creada</p>
            <p className="text-sm text-muted-foreground">
              Preparando redirección...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente de loading mientras se carga Stripe
 */
export function StripeCheckoutSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Cargando checkout seguro...</p>
    </div>
  );
}
