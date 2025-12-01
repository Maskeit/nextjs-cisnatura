'use client';

import { useEffect } from 'react';
import { initializeSession } from '@/lib/session';

/**
 * Proveedor de sesión que inicializa la autenticación automáticamente
 * al cargar la aplicación. Configura el token de axios si existe una sesión válida.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar sesión al montar el componente
    initializeSession();
  }, []);

  return <>{children}</>;
}
