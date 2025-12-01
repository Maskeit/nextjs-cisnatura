'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Truck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminConfigController from '@/lib/AdminConfigController';
import { AdminSettings } from '@/interfaces/AdminConfig';

interface ShippingConfigProps {
  settings: AdminSettings;
  onUpdate: (settings: AdminSettings) => void;
}

export function ShippingConfig({ settings, onUpdate }: ShippingConfigProps) {
  const [shippingPrice, setShippingPrice] = useState(settings.shipping_price.toString());
  const [freeThreshold, setFreeThreshold] = useState(
    settings.free_shipping_threshold?.toString() || ''
  );
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar con cambios externos
  useEffect(() => {
    setShippingPrice(settings.shipping_price.toString());
    setFreeThreshold(settings.free_shipping_threshold?.toString() || '');
  }, [settings.shipping_price, settings.free_shipping_threshold]);

  const handleSave = async () => {
    const price = parseFloat(shippingPrice);
    const threshold = freeThreshold ? parseFloat(freeThreshold) : null;

    if (isNaN(price) || price < 0) {
      toast.error('El precio de envío debe ser un número válido mayor o igual a 0');
      return;
    }

    if (threshold !== null && (isNaN(threshold) || threshold < 0)) {
      toast.error('El umbral de envío gratis debe ser un número válido mayor o igual a 0');
      return;
    }

    setIsLoading(true);

    try {
      await AdminConfigController.updateShipping({
        shipping_price: price,
        free_shipping_threshold: threshold,
      });
      
      // Refrescar configuraciones completas desde el servidor
      const refreshed = await AdminConfigController.getSettings();
      onUpdate(refreshed);
      
      toast.success('✅ Configuración de envío actualizada');
    } catch (error: any) {
      console.error('Error updating shipping:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar configuración de envío');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = 
    parseFloat(shippingPrice) !== settings.shipping_price ||
    (freeThreshold ? parseFloat(freeThreshold) : null) !== settings.free_shipping_threshold;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Configuración de Envío
        </CardTitle>
        <CardDescription>
          Define el precio de envío y el umbral para envío gratis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shipping-price">
            Precio de envío (MXN)
          </Label>
          <Input
            id="shipping-price"
            type="number"
            min="0"
            step="0.01"
            value={shippingPrice}
            onChange={(e) => setShippingPrice(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Costo fijo de envío para todas las órdenes
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="free-threshold">
            Umbral para envío gratis (MXN)
          </Label>
          <Input
            id="free-threshold"
            type="number"
            min="0"
            step="0.01"
            value={freeThreshold}
            onChange={(e) => setFreeThreshold(e.target.value)}
            placeholder="Dejar vacío para desactivar"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Compras mayores a este monto tendrán envío gratis
          </p>
        </div>

        {freeThreshold && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Vista previa:</p>
            <p className="text-muted-foreground">
              Envío ${shippingPrice} MXN (gratis en compras mayores a ${freeThreshold} MXN)
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
