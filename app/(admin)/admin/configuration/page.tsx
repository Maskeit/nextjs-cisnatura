'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, AlertCircle } from 'lucide-react';
import { MaintenanceMode } from '@/components/admin/config/MaintenanceMode';
import { ShippingConfig } from '@/components/admin/config/ShippingConfig';
import { Discounts } from '@/components/admin/config/Discounts';
import { SeasonalOffers } from '@/components/admin/config/SeasonalOffers';
import { OtherSettings } from '@/components/admin/config/OtherSettings';
import AdminConfigController from '@/lib/AdminConfigController';
import { AdminSettings } from '@/interfaces/AdminConfig';

export default function ConfigurationPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching admin settings...');
      const data = await AdminConfigController.getSettings();
      console.log('✅ Settings loaded:', data);
      setSettings(data);
    } catch (err: any) {
      console.error('❌ Error loading settings:', err);
      setError(err.response?.data?.message || 'Error al cargar configuraciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = (updatedSettings: AdminSettings) => {
    setSettings(updatedSettings);
  };

  if (isLoading) {
    console.log('🔄 Loading state...');
    return (
      <div className="container mx-auto py-8 space-y-6 max-w-7xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    console.log('⚠️ Error state:', error);
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) {
    console.log('❌ No settings - returning null');
    return null;
  }

  console.log('✨ Rendering page with settings:', settings);
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-7xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuraciones del Sistema
        </h1>
        <p className="text-muted-foreground">
          Administra las configuraciones globales de la tienda
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Envío</TabsTrigger>
          <TabsTrigger value="discounts">Descuentos</TabsTrigger>
          <TabsTrigger value="offers">Ofertas</TabsTrigger>
          <TabsTrigger value="other">Otros</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <MaintenanceMode settings={settings} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6 mt-6">
          <ShippingConfig settings={settings} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6 mt-6">
          <Discounts settings={settings} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="offers" className="space-y-6 mt-6">
          <SeasonalOffers settings={settings} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="other" className="space-y-6 mt-6">
          <OtherSettings settings={settings} onUpdate={handleUpdate} />
        </TabsContent>
      </Tabs>

      {/* Information Banner */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Nota:</strong> Los cambios en configuraciones se aplican inmediatamente en todo el sistema.
          Las ofertas temporales y descuentos se reflejan automáticamente en los productos.
        </AlertDescription>
      </Alert>
    </div>
  );
}
