'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, Package } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import PaymentController from '@/lib/PaymentController';

function StripeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('No se encontró información de la sesión de pago');
      setLoading(false);
      return;
    }

    // Obtener información de la sesión
    PaymentController.getStripeSession(sessionId)
      .then((info) => {
        setPaymentInfo(info);
        
        // Limpiar localStorage
        localStorage.removeItem('selected_address_id');
      })
      .catch((err) => {
        console.error('Error al obtener información del pago:', err);
        setError('No se pudo verificar el pago');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl md:text-3xl text-green-700 dark:text-green-400">
              ¡Pago Exitoso!
            </CardTitle>
            <CardDescription className="text-base">
              Tu pedido ha sido procesado correctamente
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {paymentInfo && (
              <>
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                    <div className="space-y-2">
                      <p><strong>ID de Sesión:</strong> {paymentInfo.session_id}</p>
                      {paymentInfo.payment_intent && (
                        <p><strong>ID de Pago:</strong> {paymentInfo.payment_intent}</p>
                      )}
                      {paymentInfo.amount_total && (
                        <p><strong>Monto Total:</strong> ${(paymentInfo.amount_total).toFixed(2)} {paymentInfo.currency?.toUpperCase()}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <Separator />

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Recibirás un correo electrónico con los detalles de tu pedido.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tu orden se está procesando y pronto será enviada.
                  </p>
                </div>
              </>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button 
              className="w-full sm:flex-1" 
              onClick={() => router.push('/perfil/mis-ordenes')}
            >
              <Package className="mr-2 h-4 w-4" />
              Ver mis pedidos
            </Button>
            <Button 
              variant="outline" 
              className="w-full sm:flex-1"
              onClick={() => router.push('/')}
            >
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <StripeSuccessContent />
    </Suspense>
  );
}
