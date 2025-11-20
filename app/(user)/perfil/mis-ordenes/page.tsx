import { Suspense } from 'react';
import MisOrdenesContent from '@/components/user/orders/MisOrdenesContent';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

function MisOrdenesFallback() {
  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

export default function MisOrdenesPage() {
  return (
    <Suspense fallback={<MisOrdenesFallback />}>
      <MisOrdenesContent />
    </Suspense>
  );
}
