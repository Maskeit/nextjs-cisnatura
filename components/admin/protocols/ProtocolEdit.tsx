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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, X, ImageIcon, GripVertical, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { FileUpload } from "./FileUpload";
import ProtocolController from "@/lib/ProtocolController";
import AdminConfigController from "@/lib/AdminConfigController";
import {
  Protocol,
  ProtocolUpdate,
  ProtocolCategory,
  ResourceType,
} from "@/interfaces/Protocol";
import { SimpleList } from "@/interfaces/Products";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PhaseCard } from "@/components/admin/protocols/ProtocolPhaseCard";

const protocolSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  long_description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  category_id: z.number().int().positive("Selecciona una categoría"),
  associated_product_ids: z.array(z.number().int()).default([]),
  author: z.string().optional(),
  version: z.string().optional(),
  estimated_duration_hours: z.number().int().min(0).optional(),
  is_featured: z.boolean(),
});

const phaseSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  slug: z.string().min(2, "Slug requerido"),
  description: z.string().optional(),
  content: z.string().min(1, "El contenido es obligatorio"),
  order: z.number().int().min(0),
  duration_minutes: z.number().int().min(0).optional(),
  is_required: z.boolean().default(true),
  resources: z.array(z.object({
    resource_type: z.enum(["image", "pdf", "video", "link", "download"] as const),
    title: z.string().min(2),
    description: z.string().optional(),
    url: z.string().min(1),
    order: z.number().int().min(0),
    is_visible: z.boolean().default(true),
  })).default([]),
});

type ProtocolFormValues = z.infer<typeof protocolSchema>;
type PhaseFormValues = z.infer<typeof phaseSchema>;

interface ProtocolEditProps {
  protocol: Protocol;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProtocolUpdated?: () => void;
}

export const ProtocolEditDialog = ({
  protocol,
  open,
  onOpenChange,
  onProtocolUpdated,
}: ProtocolEditProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [products, setProducts] = useState<SimpleList[]>([]);
  const [categories, setCategories] = useState<ProtocolCategory[]>([]);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [isCreatingPhase, setIsCreatingPhase] = useState(false);
  const [fileUploadForResource, setFileUploadForResource] = useState(false);
  const [pendingResourceUrl, setPendingResourceUrl] = useState<string | null>(null);

  const getDefaults = () => ({
    name: protocol.name,
    description: protocol.description,
    long_description: protocol.long_description || "",
    price: protocol.price,
    category_id: protocol.category_id,
    associated_product_ids: protocol.associated_product_ids || [],
    author: protocol.author || "",
    version: protocol.version || "1.0",
    estimated_duration_hours: protocol.estimated_duration_hours ?? undefined,
    is_featured: protocol.is_featured,
  });

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema) as any,
    defaultValues: getDefaults(),
  });

  const phaseForm = useForm<PhaseFormValues>({
    resolver: zodResolver(phaseSchema) as any,
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      content: "",
      order: protocol.phases.length,
      duration_minutes: undefined,
      is_required: true,
      resources: [],
    },
  });

  // Reset form + load data when dialog opens
  useEffect(() => {
    if (open) {
      form.reset(getDefaults());
      setPendingImageUrl(null);
      setSelectedProduct("");
      const fetchData = async () => {
        try {
          const [productsRes, categoriesRes] = await Promise.all([
            AdminConfigController.getProductsForDrop(),
            ProtocolController.adminListCategories(),
          ]);
          setProducts(productsRes.products);
          setCategories(categoriesRes);
        } catch {}
      };
      fetchData();
    }
  }, [open, protocol]);

  const onSubmit = async (values: ProtocolFormValues) => {
    setIsLoading(true);
    try {
      const data: ProtocolUpdate = {
        name: values.name,
        description: values.description,
        long_description: values.long_description || undefined,
        price: values.price,
        category_id: values.category_id,
        associated_product_ids: values.associated_product_ids,
        author: values.author || undefined,
        version: values.version || undefined,
        estimated_duration_hours: values.estimated_duration_hours,
        is_featured: values.is_featured,
        ...(pendingImageUrl ? { image_url: pendingImageUrl } : {}),
      };
      await ProtocolController.adminUpdate(protocol.id, data);
      toast.success("Protocolo actualizado");
      onProtocolUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.message ||
        "Error al actualizar";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    setIsPublishing(true);
    try {
      if (protocol.is_published) {
        await ProtocolController.adminUnpublish(protocol.id);
        toast.success("Protocolo despublicado");
      } else {
        await ProtocolController.adminPublish(protocol.id);
        toast.success("Protocolo publicado");
      }
      onProtocolUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.message ||
        "Error al cambiar estado";
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await ProtocolController.adminDelete(protocol.id);
      toast.success("Protocolo eliminado");
      onProtocolUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al eliminar";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleCreatePhase = async (values: PhaseFormValues) => {
    setIsCreatingPhase(true);
    try {
      const phaseData = {
        title: values.title,
        slug: values.slug || generateSlug(values.title),
        description: values.description || undefined,
        content: values.content,
        order: values.order,
        duration_minutes: values.duration_minutes || undefined,
        is_required: values.is_required,
        resources: (values.resources || []).map(r => ({
          resource_type: r.resource_type as ResourceType,
          title: r.title,
          description: r.description,
          url: r.url,
          order: r.order,
          is_visible: r.is_visible,
        })),
      };

      await ProtocolController.adminCreatePhase(protocol.id, phaseData);
      toast.success("Fase creada correctamente");
      phaseForm.reset({
        title: "",
        slug: "",
        description: "",
        content: "",
        order: protocol.phases.length + 1,
        duration_minutes: undefined,
        is_required: true,
        resources: [],
      });
      setPendingResourceUrl(null);
      setIsAddingPhase(false);
      onProtocolUpdated?.();
    } catch (error: any) {
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.message ||
        "Error al crear la fase";
      toast.error(msg);
    } finally {
      setIsCreatingPhase(false);
    }
  };

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const displayImageUrl = pendingImageUrl
    ? `${apiBase}${pendingImageUrl}`
    : protocol.image_url
      ? `${apiBase}${protocol.image_url}`
      : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Editar Protocolo</DialogTitle>
              <Badge variant={protocol.is_published ? "default" : "secondary"}>
                {protocol.is_published ? "Publicado" : "Borrador"}
              </Badge>
            </div>
            <DialogDescription>
              ID: {protocol.id} · {protocol.phases.length} fases
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="phases">
                Fases ({protocol.phases.length})
              </TabsTrigger>
            </TabsList>

            {/* ====== TAB: Información ====== */}
            <TabsContent value="info">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5 pt-2"
                >
                  {/* Imagen */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Imagen del protocolo
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="relative w-40 h-28 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                        {displayImageUrl ? (
                          <Image
                            src={displayImageUrl}
                            alt={protocol.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => setFileUploadOpen(true)}
                          className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 text-left"
                        >
                          {displayImageUrl
                            ? "Reemplazar imagen"
                            : "Subir imagen"}
                        </button>
                        {pendingImageUrl && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Nueva imagen lista (se guardará al guardar
                            cambios)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nombre */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                        <FormLabel>Descripción breve</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[80px]" {...field} />
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
                        <FormLabel>Descripción larga</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Categoría */}
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
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
                            {categories.map((cat) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id.toString()}
                              >
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Productos asociados */}
                  <FormField
                    control={form.control}
                    name="associated_product_ids"
                    render={({ field }) => {
                      const selected: number[] = field.value || [];

                      const addProduct = () => {
                        if (!selectedProduct) return;
                        const id = parseInt(selectedProduct);
                        if (!selected.includes(id)) {
                          field.onChange([...selected, id]);
                          setSelectedProduct("");
                        }
                      };

                      const removeProduct = (id: number) => {
                        field.onChange(selected.filter((x) => x !== id));
                      };

                      const getProductName = (id: number) =>
                        products.find((p) => p.id === id)?.name ||
                        `Producto ${id}`;

                      return (
                        <FormItem>
                          <FormLabel>Productos relacionados</FormLabel>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Select
                                value={selectedProduct}
                                onValueChange={setSelectedProduct}
                              >
                                <FormControl>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Selecciona un producto para agregar" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem
                                      key={p.id}
                                      value={p.id.toString()}
                                    >
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                type="button"
                                onClick={addProduct}
                                disabled={!selectedProduct}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-md border text-sm font-medium disabled:opacity-50 hover:bg-muted/50"
                              >
                                <Plus className="h-4 w-4" /> Agregar
                              </button>
                            </div>

                            {selected.length > 0 ? (
                              <div className="border rounded-lg p-3 space-y-1 bg-muted/30">
                                <p className="text-xs text-muted-foreground font-medium mb-2">
                                  Seleccionados ({selected.length})
                                </p>
                                {selected.map((id) => (
                                  <div
                                    key={id}
                                    className="flex items-center justify-between bg-background p-2 rounded border text-sm"
                                  >
                                    <span>{getProductName(id)}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeProduct(id)}
                                      className="text-destructive hover:text-destructive/80 ml-2"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground bg-muted/20 border-dashed">
                                No hay productos relacionados
                              </div>
                            )}
                          </div>
                          <FormDescription>
                            Productos que se usan en este protocolo
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="author"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Autor</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Versión</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimated_duration_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración (horas)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
                                )
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
                          <FormDescription>
                            Mostrar en sección destacados
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 mr-auto">
                      <Button
                        type="button"
                        variant={protocol.is_published ? "outline" : "default"}
                        onClick={handleTogglePublish}
                        disabled={isPublishing}
                      >
                        {isPublishing && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {protocol.is_published ? "Despublicar" : "Publicar"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Guardar Cambios
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            {/* ====== TAB: Fases ====== */}
            <TabsContent value="phases" className="space-y-4 pt-2">
              {protocol.phases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 border rounded-lg border-dashed">
                  Este protocolo no tiene fases todavía.
                </p>
              ) : (
                protocol.phases.map((phase, index) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    index={index}
                    protocolId={protocol.id}
                    onUpdated={onProtocolUpdated}
                  />
                ))
              )}

              {/* Formulario para agregar nueva fase */}
              {isAddingPhase && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <h3 className="font-semibold text-sm">Nueva Fase</h3>
                  <Form {...phaseForm}>
                    <form
                      onSubmit={phaseForm.handleSubmit(handleCreatePhase)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={phaseForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Título</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Introducción"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    phaseForm.setValue(
                                      "slug",
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
                          control={phaseForm.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Slug</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="introduccion"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={phaseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Descripción breve (opcional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="De qué trata esta fase"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={phaseForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Contenido (HTML)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="<h2>Bienvenido</h2><p>En esta fase aprenderás...</p>"
                                className="min-h-[100px] font-mono text-xs"
                                {...field}
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
                          control={phaseForm.control}
                          name="duration_minutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Duración (min)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="15"
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={phaseForm.control}
                          name="is_required"
                          render={({ field }) => (
                            <FormItem className="flex items-end gap-3 pb-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-xs !mt-0">
                                Obligatoria
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* ====== RECURSOS ====== */}
                      <PhaseResourcesSectionEdit
                        form={phaseForm}
                        fileUploadOpen={fileUploadForResource}
                        setFileUploadOpen={setFileUploadForResource}
                        pendingResourceUrl={pendingResourceUrl}
                        setPendingResourceUrl={setPendingResourceUrl}
                      />

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsAddingPhase(false);
                            phaseForm.reset({
                              title: "",
                              slug: "",
                              description: "",
                              content: "",
                              order: protocol.phases.length,
                              duration_minutes: undefined,
                              is_required: true,
                              resources: [],
                            });
                            setPendingResourceUrl(null);
                          }}
                          disabled={isCreatingPhase}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isCreatingPhase}
                          className="flex-1"
                        >
                          {isCreatingPhase && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {isCreatingPhase ? "Creando..." : "Crear fase"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              {!isAddingPhase && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center cursor-pointer"
                  onClick={() => setIsAddingPhase(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Agregar fase
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Upload de imagen */}
      <FileUpload
        open={fileUploadOpen}
        onOpenChange={setFileUploadOpen}
        currentFileUrl={displayImageUrl}
        onFileUploaded={(url) => {
          setPendingImageUrl(url);
          setFileUploadOpen(false);
        }}
        accept="image"
      />

      {/* Upload de recursos (PDFs, etc) */}
      <FileUpload
        open={fileUploadForResource}
        onOpenChange={setFileUploadForResource}
        onFileUploaded={(url) => {
          setPendingResourceUrl(url);
          setFileUploadForResource(false);
        }}
        accept="any"
      />

      {/* Confirmar eliminación */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ⚠️ ¿Eliminar protocolo permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <span className="block">
                  Se eliminará <strong>&quot;{protocol.name}&quot;</strong>{" "}
                  junto con todas sus fases y recursos.
                </span>
                <span className="block text-destructive font-medium">
                  Esta acción no se puede deshacer.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ==================== COMPONENTE: Sección de Recursos para Edit ====================

interface PhaseResourcesSectionEditProps {
  form: any;
  fileUploadOpen: boolean;
  setFileUploadOpen: (open: boolean) => void;
  pendingResourceUrl: string | null;
  setPendingResourceUrl: (url: string | null) => void;
}

const PhaseResourcesSectionEdit = ({
  form,
  fileUploadOpen,
  setFileUploadOpen,
  pendingResourceUrl,
  setPendingResourceUrl,
}: PhaseResourcesSectionEditProps) => {
  const { fields: resourceFields, append: appendResource, remove: removeResource } = useFieldArray({
    control: form.control,
    name: "resources",
  });

  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceDescription, setNewResourceDescription] = useState("");
  const [newResourceType, setNewResourceType] = useState<"image" | "pdf" | "video" | "link" | "download">("pdf");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  // Auto-populate URL field when a file upload completes
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
          onClick={() => setFileUploadOpen(true)}
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
              onChange={(e) => setNewResourceType(e.target.value as ResourceType)}
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
              onClick={() => setFileUploadOpen(true)}
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
