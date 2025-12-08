'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Mostrar el banner después de un pequeño delay para mejor UX
      setTimeout(() => setShowConsent(true), 1000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
  };

  const declineCookies = () => {
    // Si el usuario rechaza, mostrar un mensaje explicativo
    alert(
      'Las cookies son necesarias para el funcionamiento de la tienda (carrito, sesión, etc.). Sin aceptarlas, algunas funciones pueden no estar disponibles.'
    );
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-7xl">
        <div className="relative rounded-lg border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
          <div className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold leading-none tracking-tight">
                  🍪 Uso de Cookies
                </h3>
                <p className="text-sm text-muted-foreground">
                  Utilizamos cookies esenciales para mantener tu sesión, guardar tu carrito de compras 
                  y mejorar tu experiencia de navegación. Al continuar navegando, aceptas nuestro uso de cookies.
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={declineCookies}
                className="w-full sm:w-auto"
              >
                Más información
              </Button>
              <Button
                size="sm"
                onClick={acceptCookies}
                className="w-full sm:w-auto"
              >
                Aceptar cookies
              </Button>
            </div>
          </div>
          <button
            onClick={acceptCookies}
            className="absolute right-2 top-2 rounded-md p-1.5 hover:bg-accent transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
