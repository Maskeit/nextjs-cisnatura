'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import estados from '@/lib/data/estados.json';
import { Plus, Loader2 } from 'lucide-react';
import AddressController from '@/lib/AddressController';
import { Address, Estado } from '@/interfaces/Address';
import { toast } from 'sonner';

const addressFormSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(255),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').max(20),
  rfc: z.string().min(12, 'El RFC debe tener 12 o 13 caracteres').max(13).optional().or(z.literal('')),
  label: z.string().optional(),
  street: z.string().min(5, 'La calle debe tener al menos 5 caracteres').max(255),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').max(120),
  state: z.string().min(2, 'El estado debe tener al menos 2 caracteres').max(120),
  postal_code: z.string().min(3, 'El código postal debe tener al menos 3 caracteres').max(10),
  country: z.string().min(2, 'El país debe tener al menos 2 caracteres').max(80),
  is_default: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  onSuccess: () => void;
  editAddress?: Address | null;
  maxReached?: boolean;
}

export default function AddressForm({ onSuccess, editAddress, maxReached }: AddressFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [municipios, setMunicipios] = useState<string[]>([]);

  const handleEstadoChange = (estadoNombre: string) => {
    const estadoMunicipios = estados[estadoNombre as keyof typeof estados] || [];
    setMunicipios(estadoMunicipios);
  };


  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: editAddress ? {
      full_name: editAddress.full_name,
      phone: editAddress.phone,
      rfc: editAddress.rfc || '',
      label: editAddress.label || '',
      street: editAddress.street,
      city: editAddress.city,
      state: editAddress.state,
      postal_code: editAddress.postal_code,
      country: 'México',
      is_default: editAddress.is_default,
    } : {
      full_name: '',
      phone: '',
      rfc: '',
      label: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'México',
      is_default: false,
    },
  });

  const onSubmit = async (data: AddressFormValues) => {
    setIsSubmitting(true);
    try {
      // Asegurar que el país siempre sea México
      const addressData = { ...data, country: 'México' };

      if (editAddress) {
        // Actualizar dirección existente
        const response = await AddressController.updateAddress(editAddress.id, addressData);
        if (response.success) {
          toast.success('Dirección actualizada correctamente');
          setOpen(false);
          form.reset();
          onSuccess();
        }
      } else {
        // Crear nueva dirección
        const response = await AddressController.createAddress(addressData);
        if (response.success) {
          toast.success('Dirección agregada correctamente');
          setOpen(false);
          form.reset();
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Error al guardar dirección:', error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error('Ya has alcanzado el límite de 3 direcciones');
      } else {
        toast.error('Error al guardar la dirección');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si es edición, no mostrar el Dialog, solo el form
  if (editAddress) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" {...field} />
                </FormControl>
                <FormDescription>
                  Nombre de la persona que recibirá el pedido
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono *</FormLabel>
                <FormControl>
                  <Input placeholder="55 1234 5678" {...field} />
                </FormControl>
                <FormDescription>
                  Teléfono de contacto para la entrega
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rfc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RFC (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="PERJ850101ABC" {...field} />
                </FormControl>
                <FormDescription>
                  RFC para facturación (12-13 caracteres)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiqueta (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Casa, Oficina, etc." {...field} />
                </FormControl>
                <FormDescription>
                  Dale un nombre a esta dirección para identificarla fácilmente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calle y número *</FormLabel>
                <FormControl>
                  <Input placeholder="Av. Principal 123, Col. Centro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ciudad y estado para edicion con campos seteados porque ya estan solo para modificar */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleEstadoChange(value);
                      form.setValue('city', ''); // Limpiar ciudad al cambiar estado
                    }}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(estados).map((estadoNombre) => (
                        <SelectItem key={estadoNombre} value={estadoNombre}>
                          {estadoNombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    disabled={!form.watch('state')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un municipio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {form.watch('state') && estados[form.watch('state') as keyof typeof estados]?.map((municipio: string) => (
                        <SelectItem key={municipio} value={municipio}>
                          {municipio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal *</FormLabel>
                <FormControl>
                  <Input placeholder="01000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Establecer como dirección predeterminada
                  </FormLabel>
                  <FormDescription>
                    Esta dirección se usará por defecto en tus pedidos
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onSuccess();
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar dirección
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full"
          disabled={maxReached}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar nueva dirección
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar nueva dirección</DialogTitle>
          <DialogDescription>
            Completa los datos de tu dirección de envío. Puedes guardar hasta 3 direcciones.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nombre de la persona que recibirá el pedido
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input placeholder="55 1234 5678" {...field} />
                  </FormControl>
                  <FormDescription>
                    Teléfono de contacto para la entrega
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rfc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFC (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="PERJ850101ABC" {...field} />
                  </FormControl>
                  <FormDescription>
                    RFC para facturación (12-13 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiqueta (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Casa, Oficina, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Dale un nombre a esta dirección para identificarla fácilmente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calle y número *</FormLabel>
                  <FormControl>
                    <Input placeholder="Av. Principal 123, Col. Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleEstadoChange(value);
                        form.setValue('city', ''); // Limpiar ciudad al cambiar estado
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(estados).map((estadoNombre) => (
                          <SelectItem key={estadoNombre} value={estadoNombre}>
                            {estadoNombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Municipio *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch('state')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un municipio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch('state') && estados[form.watch('state') as keyof typeof estados]?.map((municipio: string) => (
                          <SelectItem key={municipio} value={municipio}>
                            {municipio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal *</FormLabel>
                  <FormControl>
                    <Input placeholder="01000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Establecer como dirección predeterminada
                    </FormLabel>
                    <FormDescription>
                      Esta dirección se usará por defecto en tus pedidos
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar dirección
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
