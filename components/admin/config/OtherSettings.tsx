'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserPlus, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminConfigController from '@/lib/AdminConfigController';
import { AdminSettings } from '@/interfaces/AdminConfig';

interface OtherSettingsProps {
  settings: AdminSettings;
  onUpdate: (settings: AdminSettings) => void;
}

export function OtherSettings({ settings, onUpdate }: OtherSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(settings.allow_user_registration);
  const [maxItems, setMaxItems] = useState(settings.max_items_per_order.toString());

  // Sincronizar con cambios externos
  useEffect(() => {
    setAllowRegistration(settings.allow_user_registration);
    setMaxItems(settings.max_items_per_order.toString());
  }, [settings.allow_user_registration, settings.max_items_per_order]);

  const handleUpdateRegistration = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      await AdminConfigController.updateUserRegistration({
        allow_user_registration: enabled,
      });
      
      // Refrescar configuraciones completas desde el servidor
      const refreshed = await AdminConfigController.getSettings();
      onUpdate(refreshed);
      
      setAllowRegistration(enabled);
      toast.success(
        enabled 
          ? '✅ Registro de usuarios habilitado'
          : '⚠️ Registro de usuarios deshabilitado'
      );
    } catch (error: any) {
      console.error('Error updating registration:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar configuración');
      setAllowRegistration(settings.allow_user_registration);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMaxItems = async () => {
    const max = parseInt(maxItems);

    if (isNaN(max) || max < 1) {
      toast.error('El límite debe ser un número mayor a 0');
      return;
    }

    setIsLoading(true);
    try {
      await AdminConfigController.updateMaxItems({
        max_items_per_order: max,
      });
      
      // Refrescar configuraciones completas desde el servidor
      const refreshed = await AdminConfigController.getSettings();
      onUpdate(refreshed);
      
      toast.success('✅ Límite de items actualizado');
    } catch (error: any) {
      console.error('Error updating max items:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar límite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Registro de Usuarios
          </CardTitle>
          <CardDescription>
            Controla si los nuevos usuarios pueden registrarse en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-registration" className="text-base">
              Permitir registro de nuevos usuarios
            </Label>
            <Switch
              id="allow-registration"
              checked={allowRegistration}
              onCheckedChange={handleUpdateRegistration}
              disabled={isLoading}
            />
          </div>
          {!allowRegistration && (
            <p className="text-sm text-muted-foreground mt-3">
              ⚠️ Los usuarios no podrán crear nuevas cuentas. Solo los usuarios existentes podrán iniciar sesión.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Límite de Productos
          </CardTitle>
          <CardDescription>
            Establece el máximo de productos permitidos por orden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-items">Máximo de productos por orden</Label>
            <Input
              id="max-items"
              type="number"
              min="1"
              value={maxItems}
              onChange={(e) => setMaxItems(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Los clientes no podrán agregar más de este número de productos a su carrito
            </p>
          </div>

          <Button
            onClick={handleUpdateMaxItems}
            disabled={isLoading || parseInt(maxItems) === settings.max_items_per_order}
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
    </div>
  );
}
