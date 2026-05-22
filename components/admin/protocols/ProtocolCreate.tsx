"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, GripVertical, X } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import ProtocolController from "@/lib/ProtocolController";
import AdminConfigController from "@/lib/AdminConfigController";
import { ProtocolCreate as ProtocolCreateType } from "@/interfaces/Protocol";
import { SimpleList } from "@/interfaces/Products";

const phaseSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  slug: z.string().min(2, "Slug requerido"),
  description: z.string().optional(),
  content: z.string().min(1, "El contenido es obligatorio"),
  order: z.number().int().min(0),
  duration_minutes: z.number().int().min(0).optional(),
  is_required: z.boolean().default(true),
});

const protocolSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  long_description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  product_id: z.number().int().positive("Selecciona un producto"),
  category_id: z.number().int().positive("Selecciona una categoría"),
  associated_product_ids: z.array(z.number().int()).default([]),
  author: z.string().optional(),
  version: z.string().default("1.0"),
  estimated_duration_hours: z.number().int().min(0).optional(),
  is_featured: z.boolean().default(false),
  phases: z.array(phaseSchema).default([]),
});

type ProtocolFormValues = z.infer<typeof protocolSchema>;

interface ProtocolCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProtocolCreated?: () => void;
}

export const ProtocolCreateDialog = ({
  open,
  onOpenChange,
  onProtocolCreated,
}: ProtocolCreateProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<SimpleList[]>([]);
  const [categories, setCategories] = useState<SimpleList[]>([]);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          AdminConfigController.getProductsForDrop(),
          fetch("/api/protocols/admin/categories")
            .then((res) => res.json())
            .then((data) => {
              if (data.data?.categories) {
                return { categories: data.data.categories };
              }
              throw new Error("Error al cargar categorías");
            }),
        ]);
        setProducts(productsRes.products);
        setCategories(categoriesRes.categories.map((cat: any) => ({ id: cat.id, name: cat.name })));
      } catch (error) {
        toast.error("Error al cargar datos");
      }
    };
    fetchData();
  }, [open]);

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      long_description: "",
      price: 0,
      product_id: undefined,
      category_id: undefined,
      associated_product_ids: [],
      author: "",
      version: "1.0",
      estimated_duration_hours: undefined,
      is_featured: false,
      phases: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "phases",
  });

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    form.setValue("slug", generateSlug(name));
  };

  const addPhase = () => {
    const order = fields.length;
    append({
      title: "",
      slug: "",
      description: "",
      content: "",
      order,
      duration_minutes: undefined,
      is_required: true,
    });
  };

  const onSubmit = async (values: ProtocolFormValues) => {
    setIsLoading(true);
    try {
      const data: ProtocolCreateType = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        long_description: values.long_description || undefined,
        price: values.price,
        product_id: values.product_id,
        category_id: values.category_id,
        associated_product_ids: values.associated_product_ids,
        author: values.author || undefined,
        version: values.version,
        estimated_duration_hours: values.estimated_duration_hours,
        is_featured: values.is_featured,
        phases: values.phases.map((p, i) => ({
          ...p,
          order: i,
          slug: p.slug || generateSlug(p.title),
        })),
      };
      await ProtocolController.adminCreate(data);
      toast.success("Protocolo creado correctamente");
      form.reset();
      onOpenChange(false);
      onProtocolCreated?.();
    } catch (error: any) {
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.message ||
        "Error al crear el protocolo";
      toast.error(msg);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Protocolo</DialogTitle>
          <DialogDescription>
            Define la información del protocolo y sus fases. Podrás agregar
            contenido HTML e imágenes después de crearlo.
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
                  <FormLabel>Nombre del Protocolo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Protocolo de Cuidado Capilar"
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
                    <Input placeholder="protocolo-cuidado-capilar" {...field} />
                  </FormControl>
                  <FormDescription>Se genera automáticamente desde el nombre</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Producto principal vinculado */}
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto principal (para carrito)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="0" disabled>
                          No hay productos disponibles
                        </SelectItem>
                      ) : (
                        products.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Producto con el que se vende este protocolo en el carrito
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoría del protocolo */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría del protocolo</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <SelectItem value="0" disabled>
                          No hay categorías disponibles
                        </SelectItem>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Categoría a la que pertenece este protocolo (ej: Sistema respiratorio)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Productos asociados / relacionados */}
            <FormField
              control={form.control}
              name="associated_product_ids"
              render={({ field }) => {
                const selected: number[] = field.value || [];
                const [selectedProduct, setSelectedProduct] = useState<string>("");

                const addProduct = () => {
                  if (!selectedProduct) return;
                  const productId = parseInt(selectedProduct);
                  if (!selected.includes(productId)) {
                    field.onChange([...selected, productId]);
                    setSelectedProduct("");
                  } else {
                    toast.warning("Este producto ya está agregado");
                  }
                };

                const removeProduct = (productId: number) => {
                  field.onChange(selected.filter((id) => id !== productId));
                };

                const getProductName = (productId: number) => {
                  return products.find((p) => p.id === productId)?.name || `Producto ${productId}`;
                };

                return (
                  <FormItem>
                    <FormLabel>Productos relacionados</FormLabel>
                    <div className="space-y-3">
                      {/* Dropdown para seleccionar productos */}
                      <div className="flex gap-2">
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecciona un producto para agregar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.length === 0 ? (
                              <div className="text-sm text-muted-foreground p-2">
                                No hay productos disponibles
                              </div>
                            ) : (
                              products.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={addProduct}
                          disabled={!selectedProduct}
                          className="whitespace-nowrap"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      </div>

                      {/* Lista de productos agregados */}
                      {selected.length > 0 ? (
                        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                          <p className="text-sm font-medium text-muted-foreground">
                            Productos seleccionados ({selected.length})
                          </p>
                          <div className="space-y-1">
                            {selected.map((productId) => (
                              <div
                                key={productId}
                                className="flex items-center justify-between bg-background p-2 rounded border"
                              >
                                <span className="text-sm">{getProductName(productId)}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => removeProduct(productId)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground bg-muted/20 border-dashed">
                          No hay productos relacionados agregados aún
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      Productos que se usan en este protocolo (el cliente podrá comprarlos)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Descripción breve */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción breve</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Resumen que se muestra en el listado..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción larga */}
            <FormField
              control={form.control}
              name="long_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción larga (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción detallada visible en la página del protocolo..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Autor */}
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autor (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Versión */}
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versión</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Duración estimada */}
              <FormField
                control={form.control}
                name="estimated_duration_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración estimada (horas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Destacado */}
            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Destacado</FormLabel>
                    <FormDescription>Mostrar en sección destacados</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ====== FASES ====== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Fases</h3>
                <Button type="button" variant="outline" size="sm" onClick={addPhase}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar fase
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
                  No hay fases aún. Puedes agregarlas ahora o después de crear el protocolo.
                </p>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Fase {index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`phases.${index}.title`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Título</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Introducción"
                              {...f}
                              onChange={(e) => {
                                f.onChange(e);
                                form.setValue(
                                  `phases.${index}.slug`,
                                  generateSlug(e.target.value)
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`phases.${index}.slug`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="introduccion" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`phases.${index}.description`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Descripción breve (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="De qué trata esta fase" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`phases.${index}.content`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Contenido (HTML)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="<h2>Bienvenido</h2><p>En esta fase aprenderás...</p>"
                            className="min-h-[100px] font-mono text-xs"
                            {...f}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Soporta HTML: h2, h3, p, ul, li, strong, em, img, a
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`phases.${index}.duration_minutes`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Duración (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="15"
                              value={f.value ?? ""}
                              onChange={(e) =>
                                f.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`phases.${index}.is_required`}
                      render={({ field: f }) => (
                        <FormItem className="flex items-end gap-3 pb-2">
                          <FormControl>
                            <Switch checked={f.value} onCheckedChange={f.onChange} />
                          </FormControl>
                          <FormLabel className="text-xs !mt-0">Obligatoria</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Protocolo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
