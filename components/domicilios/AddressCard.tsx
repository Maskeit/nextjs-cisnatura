'use client';

import { useState } from 'react';
import { Address } from '@/interfaces/Address';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Trash2, Edit, Star } from 'lucide-react';
import AddressController from '@/lib/AddressController';
import AddressForm from './AddressForm';
import { toast } from 'sonner';

interface AddressCardProps {
  address: Address;
  isSelected?: boolean;
  onSelect?: (addressId: number) => void;
  onDelete: () => void;
  onUpdate: () => void;
  showRadio?: boolean;
}

export default function AddressCard({
  address,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  showRadio = false,
}: AddressCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await AddressController.deleteAddress(address.id);
      if (response.success) {
        toast.success('Dirección eliminada correctamente');
        onDelete();
      }
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      toast.error('Error al eliminar la dirección');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async () => {
    setIsSettingDefault(true);
    try {
      const response = await AddressController.setDefaultAddress(address.id);
      if (response.success) {
        toast.success('Dirección marcada como predeterminada');
        onUpdate();
      }
    } catch (error) {
      console.error('Error al establecer dirección predeterminada:', error);
      toast.error('Error al actualizar la dirección');
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate();
  };

  return (
    <>
      <Card 
        className={`relative transition-all ${
          isSelected 
            ? 'border-primary border-2 shadow-md' 
            : 'border hover:border-primary/50'
        }`}
      >
        <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
          <div className="flex items-start gap-3">
            {/* Radio button para selección */}
            {showRadio && onSelect && (
              <div className="pt-1">
                <RadioGroupItem 
                  value={address.id.toString()} 
                  id={`address-${address.id}`}
                  onClick={() => onSelect(address.id)}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Header con label y badge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 md:mb-3">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                  {address.label && (
                    <h3 className="font-semibold text-base md:text-lg truncate">{address.label}</h3>
                  )}
                  {address.is_default && (
                    <Badge variant="secondary" className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs flex-shrink-0">
                      <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-current" />
                      <span className="hidden sm:inline">Predeterminada</span>
                      <span className="sm:hidden">Predet.</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Nombre completo */}
              <p className="font-semibold text-sm md:text-base mb-1">{address.full_name}</p>
              
              {/* Teléfono y RFC */}
              <div className="flex flex-wrap gap-2 md:gap-3 mb-1.5 md:mb-2 text-xs md:text-sm text-muted-foreground">
                <span>📱 {address.phone}</span>
                {address.rfc && (
                  <span className="font-mono">🧾 {address.rfc}</span>
                )}
              </div>

              {/* Dirección completa */}
              <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{address.street}</p>
                <p>
                  {address.city}, {address.state}
                </p>
                <p>
                  {address.postal_code}, {address.country}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-3 md:pt-4 border-t bg-muted/30 px-3 md:px-6">
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {/* Botón de editar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 md:h-9 text-xs md:text-sm"
            >
              <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              Editar
            </Button>

            {/* Botón de establecer como predeterminada */}
            {!address.is_default && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSetDefault}
                disabled={isSettingDefault}
                className="h-8 md:h-9 text-xs md:text-sm"
              >
                <Star className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">Predeterminada</span>
                <span className="sm:hidden">Predet.</span>
              </Button>
            )}
          </div>

          {/* Botón de eliminar */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 md:h-9 w-full sm:w-auto"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="ml-2 sm:hidden">Eliminar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La dirección será eliminada permanentemente.
                  {address.is_default && (
                    <span className="block mt-2 text-orange-600 font-medium">
                      Esta es tu dirección predeterminada. Se asignará automáticamente otra.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Eliminar dirección
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar dirección</DialogTitle>
            <DialogDescription>
              Actualiza los datos de tu dirección de envío
            </DialogDescription>
          </DialogHeader>
          <AddressForm 
            editAddress={address} 
            onSuccess={handleEditSuccess} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
