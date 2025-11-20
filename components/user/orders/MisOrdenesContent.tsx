"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import OrdersTable from '@/components/user/orders/OrdersTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Package } from 'lucide-react';

export default function MisOrdenesContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.info('Inicia sesión para ver tus órdenes');
      router.push('/login');
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/perfil')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-zinc-500">Mis Órdenes</h1>
          <p className="text-muted-foreground mt-1">
            Revisa el estado y detalle de todas tus compras
          </p>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <OrdersTable />
    </div>
  );
}
