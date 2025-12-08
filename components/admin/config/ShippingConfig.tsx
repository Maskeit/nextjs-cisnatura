'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Truck, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import AdminConfigController from '@/lib/AdminConfigController';
import { AdminSettings } from '@/interfaces/AdminConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface ShippingConfigProps {
  settings: AdminSettings;
  onUpdate: (settings: AdminSettings) => void;
}

export function ShippingConfig({ settings, onUpdate }: ShippingConfigProps) {
  const [shippingPrice, setShippingPrice] = useState(settings.shipping_price.toString());
  const [freeThreshold, setFreeThreshold] = useState(
    settings.free_shipping_threshold?.toString() || ''
  );
  const [categoriesNoShipping, setCategoriesNoShipping] = useState<number[]>(
    settings.categories_no_shipping || []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Cargar categorías al montar
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await AdminConfigController.getCategoriesForDrop();
        setCategories(cats.categories);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Error al cargar categorías');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Sincronizar con cambios externos
  useEffect(() => {
    setShippingPrice(settings.shipping_price.toString());
    setFreeThreshold(settings.free_shipping_threshold?.toString() || '');
    setCategoriesNoShipping(settings.categories_no_shipping || []);
  }, [settings.shipping_price, settings.free_shipping_threshold, settings.categories_no_shipping]);

  const handleAddCategory = () => {
    if (!selectedCategory) return;
    
    const categoryId = parseInt(selectedCategory);
    if (categoriesNoShipping.includes(categoryId)) {
      toast.error('Esta categoría ya está en la lista');
      return;
    }
    
    setCategoriesNoShipping([...categoriesNoShipping, categoryId]);
    setSelectedCategory('');
  };

  const handleRemoveCategory = (categoryId: number) => {
    setCategoriesNoShipping(categoriesNoShipping.filter(id => id !== categoryId));
  };

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
      // Actualizar precio y umbral
      await AdminConfigController.updateShipping({
        shipping_price: price,
        free_shipping_threshold: threshold,
      });

      // Actualizar categorías sin envío
      await AdminConfigController.updateCategoriesNoShipping({
        category_ids: categoriesNoShipping,
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
    (freeThreshold ? parseFloat(freeThreshold) : null) !== settings.free_shipping_threshold ||
    JSON.stringify(categoriesNoShipping.sort()) !== JSON.stringify(settings.categories_no_shipping.sort());

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

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <Label>Categorías sin costo de envío</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Productos virtuales o digitales que no requieren envío físico
          </p>
          
          <div className="flex gap-2">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={isLoadingCategories || isLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(cat => !categoriesNoShipping.includes(cat.id))
                  .map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddCategory}
              disabled={!selectedCategory || isLoading}
              variant="outline"
              size="icon"
            >
              +
            </Button>
          </div>

          {categoriesNoShipping.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoriesNoShipping.map(catId => {
                const category = categories.find(c => c.id === catId);
                return (
                  <Badge key={catId} variant="secondary" className="gap-1">
                    {category?.name || `ID: ${catId}`}
                    <button
                      onClick={() => handleRemoveCategory(catId)}
                      disabled={isLoading}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

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
