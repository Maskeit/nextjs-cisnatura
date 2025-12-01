'use client';

import { Suspense } from 'react';
import OrderConfirmation from '@/components/orders/OrderConfirmation';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    }>
      <OrderConfirmation />
    </Suspense>
  );
}
