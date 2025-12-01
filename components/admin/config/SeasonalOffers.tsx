'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2, Plus, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminConfigController from '@/lib/AdminConfigController';
import { AdminSettings } from '@/interfaces/AdminConfig';

interface SeasonalOffersProps {
  settings: AdminSettings;
  onUpdate: (settings: AdminSettings) => void;
}

export function SeasonalOffers({ settings, onUpdate }: SeasonalOffersProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [percentage, setPercentage] = useState('');
  const [categoryIds, setCategoryIds] = useState('');
  const [productIds, setProductIds] = useState('');

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    name: string | null;
  }>({ open: false, name: null });

  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setPercentage('');
    setCategoryIds('');
    setProductIds('');
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!name || !startDate || !endDate || !percentage) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    const disc = parseFloat(percentage);
    if (isNaN(disc) || disc < 0 || disc > 100) {
      toast.error('El porcentaje debe estar entre 0 y 100');
      return;
    }

    if (isBefore(parseISO(endDate), parseISO(startDate))) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setIsLoading(true);
    try {
      await AdminConfigController.createSeasonalOffer({
        name,
        start_date: startDate,
        end_date: endDate,
        discount_percentage: disc,
        category_ids: categoryIds ? categoryIds.split(',').map(id => id.trim()) : null,
        product_ids: productIds ? productIds.split(',').map(id => id.trim()) : null,
      });
      
      // Refrescar configuraciones completas desde el servidor
      const refreshed = await AdminConfigController.getSettings();
      onUpdate(refreshed);
      
      resetForm();
      toast.success('✅ Oferta temporal creada');
    } catch (error: any) {
      console.error('Error creating seasonal offer:', error);
      toast.error(error.response?.data?.message || 'Error al crear oferta temporal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.name) return;

    setIsLoading(true);
    try {
      await AdminConfigController.removeSeasonalOffer(deleteDialog.name);
      
      // Refrescar configuraciones completas desde el servidor
      const refreshed = await AdminConfigController.getSettings();
      onUpdate(refreshed);
      
      toast.success('✅ Oferta temporal eliminada');
      setDeleteDialog({ open: false, name: null });
    } catch (error: any) {
      console.error('Error deleting seasonal offer:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar oferta');
    } finally {
      setIsLoading(false);
    }
  };

  const getOfferStatus = (offer: any) => {
    const now = new Date();
    const start = parseISO(offer.start_date);
    const end = parseISO(offer.end_date);

    if (isBefore(now, start)) {
      return { label: 'Próximamente', variant: 'secondary' as const };
    } else if (isAfter(now, end)) {
      return { label: 'Finalizada', variant: 'destructive' as const };
    } else {
      return { label: 'Activa', variant: 'default' as const };
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ofertas Temporales
          </CardTitle>
          <CardDescription>
            Crea ofertas por tiempo limitado (Black Friday, Navidad, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear nueva oferta
            </Button>
          ) : (
            <div className="space-y-3 border rounded-lg p-4">
              <div className="space-y-2">
                <Label htmlFor="offer-name">Nombre de la oferta *</Label>
                <Input
                  id="offer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Black Friday 2025"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha inicio *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha fin *</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Porcentaje de descuento * (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-ids">IDs de categorías (opcional)</Label>
                <Input
                  id="category-ids"
                  value={categoryIds}
                  onChange={(e) => setCategoryIds(e.target.value)}
                  placeholder="Ej: 1,2,5 (separados por coma)"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Dejar vacío para aplicar a todas las categorías
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-ids">IDs de productos (opcional)</Label>
                <Input
                  id="product-ids"
                  value={productIds}
                  onChange={(e) => setProductIds(e.target.value)}
                  placeholder="Ej: 123,456,789 (separados por coma)"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Especificar productos individuales (mayor prioridad que categorías)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Crear oferta
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {settings.seasonal_offers.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.seasonal_offers.map((offer) => {
                    const status = getOfferStatus(offer);
                    return (
                      <TableRow key={offer.name}>
                        <TableCell className="font-medium">{offer.name}</TableCell>
                        <TableCell className="text-sm">
                          {format(parseISO(offer.start_date), 'dd MMM yyyy', { locale: es })}
                          {' - '}
                          {format(parseISO(offer.end_date), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>{offer.discount_percentage}%</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog({
                              open: true,
                              name: offer.name,
                            })}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay ofertas temporales configuradas</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => 
        setDeleteDialog({ ...deleteDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar oferta temporal?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la oferta &quot;{deleteDialog.name}&quot;.
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
