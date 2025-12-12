'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import OrderSummary from '@/components/orders/OrderSummary';
import OrderSummarySkeleton from '@/components/orders/OrderSummarySkeleton';


export default function ResumenPage() {
  return (
    <div className="min-h-screen px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <Link href="/carrito">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al carrito
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/carrito">Carrito</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/domicilio">Domicilio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">Resumen de orden</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-zinc-400">
            Resumen de tu Orden
          </h1>
        </div>

        <Suspense fallback={<OrderSummarySkeleton />}>
          <OrderSummary />
        </Suspense>
      </div>
    </div>
  );
}
