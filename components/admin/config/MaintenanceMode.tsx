'use client';

import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminConfigController from '@/lib/AdminConfigController';
import { AdminSettings } from '@/interfaces/AdminConfig';

interface MaintenanceModeProps {
  settings: AdminSettings;
  onUpdate: (settings: AdminSettings) => void;
}

export function MaintenanceMode({ settings, onUpdate }: MaintenanceModeProps) {
  const [isEnabled, setIsEnabled] = useState(settings.maintenance_mode);
  const [message, setMessage] = useState(settings.maintenance_message || '');
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar con cambios externos
  React.useEffect(() => {
    setIsEnabled(settings.maintenance_mode);
    setMessage(settings.maintenance_message || '');
  }, [settings.maintenance_mode, settings.maintenance_message]);

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    if (checked) {
      setShowDialog(true);
    } else {
      handleSave(checked);
    }
  };

  const handleSave = async (enableMode?: boolean) => {
    const modeToSet = enableMode !== undefined ? enableMode : isEnabled;
    setIsLoading(true);

    try {
      await AdminConfigController.updateMaintenance({
        maintenance_mode: modeToSet,
        maintenance_message: message || undefined,
      });
      
      // Refrescar configuraciones completas desde el servidor
      const refreshed = await AdminConfigController.getSettings();
      onUpdate(refreshed);
      
      toast.success(
        modeToSet 
          ? '⚠️ Modo mantenimiento activado'
          : '✅ Modo mantenimiento desactivado'
      );
      setShowDialog(false);
    } catch (error: any) {
      console.error('Error updating maintenance mode:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar modo mantenimiento');
      setIsEnabled(settings.maintenance_mode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Modo Mantenimiento
          </CardTitle>
          <CardDescription>
            Bloquea el acceso a la API para usuarios normales. Los administradores siempre pueden acceder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-mode" className="text-base">
              Activar modo mantenimiento
            </Label>
            <Switch
              id="maintenance-mode"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">
              Mensaje de mantenimiento
            </Label>
            <Textarea
              id="maintenance-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Sistema en mantenimiento. Volveremos pronto..."
              rows={3}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Este mensaje se mostrará a los usuarios cuando intenten acceder al sistema
            </p>
          </div>

          <Button
            onClick={() => handleSave()}
            disabled={isLoading || message === settings.maintenance_message}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Actualizar mensaje'
            )}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ ¿Activar modo mantenimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto bloqueará el acceso a todos los usuarios normales. Solo los administradores podrán acceder al sistema.
              <br /><br />
              ¿Estás seguro de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsEnabled(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSave(true)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, activar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
