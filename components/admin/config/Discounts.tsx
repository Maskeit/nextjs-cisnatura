'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Percent, Loader2, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import AdminConfigController from '@/lib/AdminConfigController';
import { AdminSettings } from '@/interfaces/AdminConfig';

interface DiscountsProps {
  settings: AdminSettings;
  onUpdate: (settings: AdminSettings) => void;
}

export function Discounts({ settings, onUpdate }: DiscountsProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Global discount
  const [globalEnabled, setGlobalEnabled] = useState(settings.global_discount_enabled);
  const [globalPercentage, setGlobalPercentage] = useState(
    settings.global_discount_percentage.toString()
  );
  const [globalName, setGlobalName] = useState(settings.global_discount_name || '');

  // Category discount
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategoryPercentage, setNewCategoryPercentage] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Product discount
  const [newProductId, setNewProductId] = useState('');
  const [newProductPercentage, setNewProductPercentage] = useState('');
  const [newProductName, setNewProductName] = useState('');

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'category' | 'product' | null;
    id: string | null;
    name: string | null;
  }>({ open: false, type: null, id: null, name: null });

  const handleSaveGlobal = async () => {
    const percentage = parseFloat(globalPercentage);

    if (globalEnabled && (isNaN(percentage) || percentage < 0 || percentage > 100)) {
      toast.error('El porcentaje debe estar entre 0 y 100');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await AdminConfigController.updateGlobalDiscount({
        enabled: globalEnabled,
        percentage,
        name: globalName || undefined,
      });
      
      onUpdate(updated);
      toast.success('✅ Descuento global actualizado');
    } catch (error: any) {
      console.error('Error updating global discount:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar descuento global');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategoryDiscount = async () => {
    const percentage = parseFloat(newCategoryPercentage);

    if (!newCategoryId || !newCategoryName) {
      toast.error('Completa todos los campos');
      return;
    }

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('El porcentaje debe estar entre 0 y 100');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await AdminConfigController.addCategoryDiscount({
        category_id: newCategoryId,
        percentage,
        name: newCategoryName,
      });
      
      onUpdate(updated);
      setNewCategoryId('');
      setNewCategoryPercentage('');
      setNewCategoryName('');
      toast.success('✅ Descuento de categoría agregado');
    } catch (error: any) {
      console.error('Error adding category discount:', error);
      toast.error(error.response?.data?.message || 'Error al agregar descuento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProductDiscount = async () => {
    const percentage = parseFloat(newProductPercentage);

    if (!newProductId || !newProductName) {
      toast.error('Completa todos los campos');
      return;
    }

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('El porcentaje debe estar entre 0 y 100');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await AdminConfigController.addProductDiscount({
        product_id: newProductId,
        percentage,
        name: newProductName,
      });
      
      onUpdate(updated);
      setNewProductId('');
      setNewProductPercentage('');
      setNewProductName('');
      toast.success('✅ Descuento de producto agregado');
    } catch (error: any) {
      console.error('Error adding product discount:', error);
      toast.error(error.response?.data?.message || 'Error al agregar descuento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.type || !deleteDialog.id) return;

    setIsLoading(true);
    try {
      let updated;
      if (deleteDialog.type === 'category') {
        updated = await AdminConfigController.removeCategoryDiscount(deleteDialog.id);
      } else {
        updated = await AdminConfigController.removeProductDiscount(deleteDialog.id);
      }
      
      onUpdate(updated);
      toast.success('✅ Descuento eliminado');
      setDeleteDialog({ open: false, type: null, id: null, name: null });
    } catch (error: any) {
      console.error('Error deleting discount:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar descuento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Descuentos
          </CardTitle>
          <CardDescription>
            Configura descuentos globales, por categoría o por producto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="global" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="category">Categorías</TabsTrigger>
              <TabsTrigger value="product">Productos</TabsTrigger>
            </TabsList>

            {/* Global Discount */}
            <TabsContent value="global" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="global-enabled" className="text-base">
                  Activar descuento global
                </Label>
                <Switch
                  id="global-enabled"
                  checked={globalEnabled}
                  onCheckedChange={setGlobalEnabled}
                  disabled={isLoading}
                />
              </div>

              {globalEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="global-percentage">Porcentaje (%)</Label>
                    <Input
                      id="global-percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={globalPercentage}
                      onChange={(e) => setGlobalPercentage(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="global-name">Nombre de la oferta</Label>
                    <Input
                      id="global-name"
                      value={globalName}
                      onChange={(e) => setGlobalName(e.target.value)}
                      placeholder="Ej: Oferta Especial"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              <Button
                onClick={handleSaveGlobal}
                disabled={isLoading}
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

              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Nota:</p>
                El descuento global se aplica a todos los productos que no tengan un descuento más específico.
              </div>
            </TabsContent>

            {/* Category Discounts */}
            <TabsContent value="category" className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="ID de categoría"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Porcentaje"
                  value={newCategoryPercentage}
                  onChange={(e) => setNewCategoryPercentage(e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Nombre del descuento"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleAddCategoryDiscount}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar descuento
                </Button>
              </div>

              {Object.keys(settings.category_discounts).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(settings.category_discounts).map(([id, discount]) => (
                      <TableRow key={id}>
                        <TableCell className="font-mono">{id}</TableCell>
                        <TableCell>{discount.name}</TableCell>
                        <TableCell>{discount.percentage}%</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({
                              open: true,
                              type: 'category',
                              id,
                              name: discount.name,
                            })}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay descuentos de categoría configurados</p>
                </div>
              )}
            </TabsContent>

            {/* Product Discounts */}
            <TabsContent value="product" className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="ID de producto"
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Porcentaje"
                  value={newProductPercentage}
                  onChange={(e) => setNewProductPercentage(e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Nombre del descuento"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleAddProductDiscount}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar descuento
                </Button>
              </div>

              {Object.keys(settings.product_discounts).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(settings.product_discounts).map(([id, discount]) => (
                      <TableRow key={id}>
                        <TableCell className="font-mono">{id}</TableCell>
                        <TableCell>{discount.name}</TableCell>
                        <TableCell>{discount.percentage}%</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({
                              open: true,
                              type: 'product',
                              id,
                              name: discount.name,
                            })}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay descuentos de producto configurados</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => 
        setDeleteDialog({ ...deleteDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar descuento?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el descuento &quot;{deleteDialog.name}&quot;.
              <br /><br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
