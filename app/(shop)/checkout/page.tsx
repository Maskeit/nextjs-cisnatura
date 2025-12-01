'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Esta página redirige a /checkout/resumen
// Mantenerla por compatibilidad
export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/checkout/resumen');
  }, [router]);

  return null;
}
