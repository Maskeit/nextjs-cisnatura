"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateProductRequest, Category } from '@/interfaces/Products';
import ProductController from '@/lib/ProductController';
import { toast } from 'sonner';
import { Loader2, ImageIcon } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import Image from 'next/image';

const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  price: z.number().min(0, "El precio debe ser mayor a 0"),
  stock: z.number().int().min(0, "El stock debe ser mayor o igual a 0"),
  category_id: z.number().int().positive("Selecciona una categoría válida"),
  image_url: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: () => void;
}

export const ProductCreate = ({ open, onOpenChange, onProductCreated }: ProductCreateProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  // Cargar categorías al abrir el dialog
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const response = await ProductController.getCategories({ limit: 100 });
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.error('Error al cargar las categorías');
    }
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      stock: 0,
      category_id: undefined,
      image_url: null,
    },
  });

  // Auto-generar slug desde el nombre
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    form.setValue('slug', generateSlug(name));
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsLoading(true);
    try {
      const createData: CreateProductRequest = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        price: values.price,
        stock: values.stock,
        category_id: values.category_id,
        image_url: values.image_url,
      };

      await ProductController.adminCreate(createData);
      
      toast.success('Producto creado correctamente');
      form.reset();
      onOpenChange(false);
      if (onProductCreated) onProductCreated();
    } catch (error: any) {
      console.error('Error al crear producto:', error);
      
      let errorMessage = 'Error al crear el producto';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (typeof errorDetail === 'object' && errorDetail.message) {
          errorMessage = errorDetail.message;
        } else if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa la información del nuevo producto. Todos los campos son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Aceite Esencial de Lavanda" 
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="aceite-esencial-lavanda" {...field} />
                  </FormControl>
                  <FormDescription>
                    Se genera automáticamente desde el nombre, pero puedes editarlo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe las características y beneficios del producto..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Precio */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (MXN)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="299.99"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stock */}
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Disponible</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="50"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Categoría */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <SelectItem value="0" disabled>Cargando categorías...</SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Imagen del producto */}
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => {
                const imageUrl = field.value 
                  ? `${process.env.NEXT_PUBLIC_API_URL}${field.value}`
                  : null;
                
                return (
                  <FormItem>
                    <FormLabel>Imagen del Producto</FormLabel>
                    <div className="space-y-3">
                      {/* Preview de imagen */}
                      <div className="relative w-full aspect-video max-w-md rounded-lg overflow-hidden border bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt="Preview del producto"
                            fill
                            className="object-cover"
                            unoptimized
                            key={field.value}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground mt-2">
                                Sin imagen
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botón para subir imagen */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsImageUploadOpen(true)}
                        className="w-full"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {field.value ? 'Cambiar Imagen' : 'Subir Imagen'}
                      </Button>

                      {/* Input oculto con el nombre del archivo */}
                      <FormControl>
                        <Input 
                          type="hidden"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Formatos aceptados: JPG, PNG, WebP (máx. 5MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Producto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Dialog de upload de imagen */}
      <ImageUpload
        open={isImageUploadOpen}
        onOpenChange={setIsImageUploadOpen}
        currentImageUrl={form.watch('image_url')}
        onImageUploaded={(fileUrl) => {
          form.setValue('image_url', fileUrl);
          toast.success('Imagen cargada. Recuerda completar los demás campos.');
        }}
      />
    </Dialog>
  );
};
