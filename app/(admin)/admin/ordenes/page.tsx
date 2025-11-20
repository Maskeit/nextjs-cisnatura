import { Suspense } from 'react';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import OrderStatsCards from '@/components/admin/orders/OrderStatsCards';

export default function AdminOrdenesPage() {
  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-500">Gestión de Órdenes</h1>
        <p className="text-muted-foreground mt-2">
          Administra y da seguimiento a todas las órdenes de la tienda
        </p>
      </div>

      {/* Estadísticas */}
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <OrderStatsCards />
      </Suspense>

      {/* Tabla de órdenes */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Todas las Órdenes</h2>
        <Suspense fallback={<TableLoadingSkeleton />}>
          <OrdersTable />
        </Suspense>
      </div>
    </div>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="h-96 bg-muted animate-pulse" />
      </div>
    </div>
  );
}
