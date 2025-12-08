'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, Loader2, ShoppingCart, CreditCard, Home } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function StripeCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    console.log('Stripe session cancelled:', sessionId);
  }, [searchParams]);

  return (
    <div className="min-h-screen px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl md:text-3xl text-red-700 dark:text-red-400">
              Pago Cancelado
            </CardTitle>
            <CardDescription className="text-base">
              Has cancelado el proceso de pago
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertTitle className="text-blue-700 dark:text-blue-300">
                ¿Qué sucede ahora?
              </AlertTitle>
              <AlertDescription className="text-sm text-blue-600 dark:text-blue-400">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Tu carrito sigue intacto con todos tus productos</li>
                  <li>No se realizó ningún cargo a tu tarjeta</li>
                  <li>Puedes intentar nuevamente cuando estés listo</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Razones comunes para cancelar:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Necesitas revisar los productos antes de comprar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Quieres agregar o quitar productos del carrito</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Prefieres usar otro método de pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Cambiar la dirección de envío</span>
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button 
              className="w-full sm:flex-1" 
              onClick={() => router.push('/checkout/resumen')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Intentar nuevamente
            </Button>
            <Button 
              variant="outline" 
              className="w-full sm:flex-1"
              onClick={() => router.push('/carrito')}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Volver al carrito
            </Button>
            <Button 
              variant="ghost" 
              className="w-full sm:flex-1"
              onClick={() => router.push('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function StripeCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <StripeCancelContent />
    </Suspense>
  );
}
