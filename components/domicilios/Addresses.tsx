'use client';

import { useState, useEffect } from 'react';
import { Address } from '@/interfaces/Address';
import { RadioGroup } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import AddressController from '@/lib/AddressController';
import AddressCard from './AddressCard';
import AddressForm from './AddressForm';
import { toast } from 'sonner';

interface AddressesProps {
  onAddressSelect: (addressId: number) => void;
  selectedAddressId?: number;
}

export default function Addresses({ onAddressSelect, selectedAddressId }: AddressesProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [maxAddresses, setMaxAddresses] = useState(3);
  const [selectedAddress, setSelectedAddress] = useState<number | undefined>(selectedAddressId);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await AddressController.getAddresses();
      if (response.success) {
        setAddresses(response.data.addresses);
        setTotal(response.data.total);
        setMaxAddresses(response.data.max_addresses);
        
        // Si hay una dirección predeterminada y no hay selección, usarla
        if (!selectedAddress && response.data.addresses.length > 0) {
          const defaultAddr = response.data.addresses.find(addr => addr.is_default);
          if (defaultAddr) {
            setSelectedAddress(defaultAddr.id);
            onAddressSelect(defaultAddr.id);
          }
        }
      }
    } catch (error: any) {
      console.error('Error al cargar direcciones:', error);
      
      if (error.response?.status === 401) {
        toast.error('Debes iniciar sesión para ver tus direcciones');
      } else {
        toast.error('Error al cargar las direcciones');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddress(addressId);
    onAddressSelect(addressId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxReached = total >= maxAddresses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Dirección de envío</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} de {maxAddresses} direcciones guardadas
        </span>
      </div>

      <Separator />

      {/* Alert si alcanzó el límite */}
      {maxReached && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Has alcanzado el límite de {maxAddresses} direcciones. Elimina una dirección existente para agregar una nueva.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de direcciones con radio buttons */}
      {addresses.length > 0 ? (
        <RadioGroup 
          value={selectedAddress?.toString()} 
          onValueChange={(value) => handleAddressSelect(parseInt(value))}
          className="space-y-4"
        >
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={selectedAddress === address.id}
              onSelect={handleAddressSelect}
              onDelete={fetchAddresses}
              onUpdate={fetchAddresses}
              showRadio={true}
            />
          ))}
        </RadioGroup>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tienes direcciones guardadas</h3>
          <p className="text-muted-foreground mb-4">
            Agrega tu primera dirección de envío
          </p>
        </div>
      )}

      {/* Botón para agregar nueva dirección */}
      <AddressForm 
        onSuccess={fetchAddresses} 
        maxReached={maxReached}
      />
    </div>
  );
}
