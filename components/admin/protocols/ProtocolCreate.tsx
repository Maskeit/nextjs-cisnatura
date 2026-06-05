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
import { Loader2, Plus, Trash2, GripVertical, X, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import ProtocolController from "@/lib/ProtocolController";
import AdminConfigController from "@/lib/AdminConfigController";
import { ProtocolCreate as ProtocolCreateType, ResourceType } from "@/interfaces/Protocol";
import { SimpleList } from "@/interfaces/Products";
import { generateSlug } from "@/lib/utils"
import { FileUpload } from "./FileUpload";

const resourceSchema = z.object({
  resource_type: z.enum(["image", "pdf", "video", "link", "download"]),
  title: z.string().min(2, "Título requerido"),
  description: z.string().optional(),
  url: z.string().min(1, "URL requerida"),
  order: z.number().int().min(0),
  is_visible: z.boolean().default(true),
});

const phaseSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  slug: z.string().min(2, "Slug requerido"),
  description: z.string().optional(),
  content: z.string().min(1, "El contenido es obligatorio"),
  order: z.number().int().min(0),
  duration_minutes: z.number().int().min(0).optional(),
  is_required: z.boolean().default(true),
  resources: z.array(resourceSchema).default([]),
});

const protocolSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  long_description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
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
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState<number | null>(null);
  const [pendingResourceUrl, setPendingResourceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          AdminConfigController.getProductsForDrop(),
          ProtocolController.adminListCategories()  
        ]);
        setProducts(productsRes.products);
        setCategories(categoriesRes.map((cat: any) => ({ id: cat.id, name: cat.name })));
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
      resources: [],
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
        category_id: values.category_id,
        associated_product_ids: values.associated_product_ids,
        author: values.author || undefined,
        version: values.version,
        estimated_duration_hours: values.estimated_duration_hours,
        is_featured: values.is_featured,
        phases: values.phases.map((p, i) => ({
          title: p.title,
          slug: p.slug || generateSlug(p.title),
          description: p.description || undefined,
          content: p.content,
          order: i,
          duration_minutes: p.duration_minutes || undefined,
          is_required: p.is_required,
          resources: (p.resources || []).map(r => ({
            resource_type: r.resource_type as ResourceType,
            title: r.title,
            description: r.description,
            url: r.url,
            order: r.order,
            is_visible: r.is_visible,
          })),
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
    <>
    
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
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
                      <Input placeholder="Sofia Geovana" {...field} />
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

                  {/* ====== RECURSOS ====== */}
                  <PhaseResourcesSection
                    phaseIndex={index}
                    form={form}
                    onEditingPhaseChange={setEditingPhaseIndex}
                    fileUploadOpen={fileUploadOpen}
                    setFileUploadOpen={setFileUploadOpen}
                    pendingResourceUrl={pendingResourceUrl}
                    setPendingResourceUrl={setPendingResourceUrl}
                  />
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

    {/* File Upload para recursos */}
    <FileUpload
      open={fileUploadOpen}
      onOpenChange={setFileUploadOpen}
      onFileUploaded={(url) => {
        setPendingResourceUrl(url);
        setFileUploadOpen(false);
      }}
      accept="any"
    />
    </>
  );
};

// ==================== COMPONENTE: Sección de Recursos ====================

interface PhaseResourcesSectionProps {
  phaseIndex: number;
  form: any;
  onEditingPhaseChange: (index: number | null) => void;
  fileUploadOpen: boolean;
  setFileUploadOpen: (open: boolean) => void;
  pendingResourceUrl: string | null;
  setPendingResourceUrl: (url: string | null) => void;
}

const PhaseResourcesSection = ({
  phaseIndex,
  form,
  onEditingPhaseChange,
  fileUploadOpen,
  setFileUploadOpen,
  pendingResourceUrl,
  setPendingResourceUrl,
}: PhaseResourcesSectionProps) => {
  const { fields: resourceFields, append: appendResource, remove: removeResource } = useFieldArray({
    control: form.control,
    name: `phases.${phaseIndex}.resources`,
  });

  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceDescription, setNewResourceDescription] = useState("");
  const [newResourceType, setNewResourceType] = useState<"image" | "pdf" | "video" | "link" | "download">("pdf");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  // Auto-populate URL field when a file upload completes for this phase
  useEffect(() => {
    if (pendingResourceUrl) {
      setNewResourceUrl(pendingResourceUrl);
    }
  }, [pendingResourceUrl]);

  const handleAddResource = () => {
    const effectiveUrl = newResourceUrl || pendingResourceUrl || "";
    if (!newResourceTitle || !effectiveUrl) {
      toast.error("Completa al menos título y URL");
      return;
    }

    appendResource({
      resource_type: newResourceType,
      title: newResourceTitle,
      description: newResourceDescription || undefined,
      url: effectiveUrl,
      order: resourceFields.length,
      is_visible: true,
    });

    setNewResourceTitle("");
    setNewResourceDescription("");
    setNewResourceUrl("");
    setNewResourceType("pdf");
    setPendingResourceUrl(null);
  };

  const handleUploadClick = () => {
    onEditingPhaseChange(phaseIndex);
    setFileUploadOpen(true);
  };

  return (
    <div className="border-t pt-3 mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground">
          RECURSOS ({resourceFields.length})
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUploadClick}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Agregar recurso
        </Button>
      </div>

      {/* Lista de recursos existentes */}
      {resourceFields.length > 0 && (
        <div className="space-y-2 bg-muted/30 p-2 rounded border border-dashed">
          {resourceFields.map((resource: any, rIndex) => (
            <div
              key={resource.id}
              className="flex items-center justify-between bg-background p-2 rounded border text-xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {resource.resource_type === "pdf" && (
                  <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                {resource.resource_type === "link" && (
                  <Download className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                {resource.resource_type === "image" && (
                  <Download className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{resource.title}</p>
                  <p className="text-muted-foreground truncate">{resource.url}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive flex-shrink-0"
                onClick={() => removeResource(rIndex)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar nuevo recurso */}
      <div className="border rounded-lg p-2 bg-muted/10 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Tipo</label>
            <select
              value={newResourceType}
              onChange={(e) => setNewResourceType(e.target.value as "image" | "pdf" | "video" | "link" | "download")}
              className="w-full border rounded px-2 py-1 text-xs"
            >
              <option value="pdf">PDF</option>
              <option value="image">Imagen</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
              <option value="download">Descarga</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Título</label>
            <Input
              type="text"
              placeholder="Mi recurso"
              value={newResourceTitle}
              onChange={(e) => setNewResourceTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Descripción (opcional)</label>
          <Input
            type="text"
            placeholder="Descripción del recurso"
            value={newResourceDescription}
            onChange={(e) => setNewResourceDescription(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">URL</label>
          <div className="flex gap-1">
            <Input
              type="text"
              placeholder="https://ejemplo.com/archivo.pdf"
              value={newResourceUrl}
              onChange={(e) => setNewResourceUrl(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              className="h-8 text-xs px-2"
            >
              Subir
            </Button>
          </div>
          {pendingResourceUrl && !newResourceUrl && (
            <p className="text-xs text-green-700">
              ✓ Archivo subido — se usará como URL
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddResource}
          className="w-full h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Agregar a fase
        </Button>
      </div>
    </div>
  );
};
