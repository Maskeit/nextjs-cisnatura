import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function OrderSummarySkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Columna izquierda */}
      <div className="lg:col-span-2 space-y-6">
        {/* Dirección Skeleton */}
        <Card>
              <CardHeader className="p-4 md:p-6">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-2 p-4 md:p-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
            </CardContent>
        </Card>

        {/* Productos Skeleton */}
        <Card>
              <CardHeader className="p-4 md:p-6">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                {[1, 2, 3].map((i) => (
                  <div key={`skeleton-${i}`} className="flex gap-3 md:gap-4">
                    <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
            </CardContent>
        </Card>
      </div>

      {/* Columna derecha - Resumen */}
      <div className="lg:col-span-1">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-full mt-4" />
                </div>
                <Skeleton className="h-10 w-full mt-6" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
