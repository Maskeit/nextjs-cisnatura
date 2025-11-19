'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Addresses from '@/components/domicilios/Addresses';
import { toast } from 'sonner';

export default function DomicilioPage() {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>();

  const handleContinue = () => {
    if (!selectedAddressId) {
      toast.error('Por favor selecciona una dirección de envío');
      return;
    }

    // Guardar la dirección seleccionada y continuar al resumen
    // TODO: Guardar en localStorage o contexto para usar en el resumen
    localStorage.setItem('selected_address_id', selectedAddressId.toString());
    router.push('/checkout/resumen');
  };

  return (
    <div className="min-h-screen px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/carrito">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al carrito
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/carrito">Carrito</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">Domicilio</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground">Resumen de orden</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Componente de direcciones */}
        <Addresses 
          onAddressSelect={setSelectedAddressId}
          selectedAddressId={selectedAddressId}
        />

        {/* Botón de continuar */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Link href="/carrito">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al carrito
            </Button>
          </Link>

          <Button 
            size="lg"
            onClick={handleContinue}
            disabled={!selectedAddressId}
          >
            Continuar al resumen
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
