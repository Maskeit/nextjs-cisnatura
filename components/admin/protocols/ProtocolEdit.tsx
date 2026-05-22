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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, GripVertical, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { FileUpload } from "./FileUpload";
import ProtocolController from "@/lib/ProtocolController";
import AdminConfigController from "@/lib/AdminConfigController";
import { Protocol, ProtocolUpdate, ProtocolPhase } from "@/interfaces/Protocol";
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

const protocolSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  long_description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  associated_product_ids: z.array(z.number().int()).default([]),
  author: z.string().optional(),
  version: z.string().optional(),
  estimated_duration_hours: z.number().int().min(0).optional(),  
  is_featured: z.boolean(),
  is_published: z.boolean(),
});

type ProtocolFormValues = z.infer<typeof protocolSchema>;

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

  const getDefaults = () => ({
    name: protocol.name,
    description: protocol.description,
    long_description: protocol.long_description || "",
    price: protocol.price,
    associated_product_ids: protocol.associated_product_ids || [],
    author: protocol.author || "",
    version: protocol.version || "1.0",
    estimated_duration_hours: protocol.estimated_duration_hours ?? undefined,
    is_featured: protocol.is_featured,
    is_published: protocol.is_published,
  });

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema) as any,
    defaultValues: getDefaults(),
  });

  // Reset form + load products when dialog opens
  useEffect(() => {
    if (open) {
      form.reset(getDefaults());
      const fetchProducts = async () => {
        try {
          const response = await AdminConfigController.getProductsForDrop();
          setProducts(response.products);
        } catch {}
      };
      fetchProducts();
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
        associated_product_ids: values.associated_product_ids,
        author: values.author || undefined,
        version: values.version || undefined,
        estimated_duration_hours: values.estimated_duration_hours,
        is_featured: values.is_featured,
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

  const imageUrl = protocol.image_url
    ? `${process.env.NEXT_PUBLIC_API_URL}${protocol.image_url}`
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Editar Protocolo</DialogTitle>
              <Badge variant={protocol.is_published ? "default" : "secondary"}>
                {protocol.is_published ? "Publicado" : "Borrador"}
              </Badge>
            </div>
            <DialogDescription>
              ID: {protocol.id} · Producto #{protocol.product_id} · {protocol.phases.length} fases
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                  {/* Imagen preview */}
                  {imageUrl && (
                    <div className="relative w-full aspect-video max-w-sm rounded-lg overflow-hidden border bg-muted">
                      <Image src={imageUrl} alt={protocol.name} fill className="object-cover" unoptimized />
                    </div>
                  )}

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
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                      const toggle = (id: number) => {
                        field.onChange(
                          selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
                        );
                      };
                      return (
                        <FormItem>
                          <FormLabel>Productos relacionados</FormLabel>
                          <div className="border rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                            {products.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-2">Cargando...</p>
                            ) : (
                              products.map((p) => (
                                <label
                                  key={p.id}
                                  className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(p.id)}
                                    onChange={() => toggle(p.id)}
                                    className="rounded"
                                  />
                                  {p.name}
                                </label>
                              ))
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

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 mr-auto">
                      <Button
                        type="button"
                        variant={protocol.is_published ? "outline" : "default"}
                        onClick={handleTogglePublish}
                        disabled={isPublishing}
                      >
                        {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  <PhaseCard key={phase.id} phase={phase} index={index} />
                ))
              )}
              <p className="text-xs text-muted-foreground text-center">
                Para editar fases individualmente, usa los endpoints de la API directamente por ahora.
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ⚠️ ¿Eliminar protocolo permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Se eliminará <strong>&quot;{protocol.name}&quot;</strong> junto con todas sus fases
                y recursos.
              </p>
              <p className="text-destructive font-medium">Esta acción no se puede deshacer.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
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

/** Tarjeta de visualización de fase dentro de la pestaña Fases */
function PhaseCard({ phase, index }: { phase: ProtocolPhase; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{phase.title}</p>
          {phase.description && (
            <p className="text-xs text-muted-foreground truncate">{phase.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {phase.duration_minutes && <span>{phase.duration_minutes} min</span>}
          {!phase.is_required && <Badge variant="outline" className="text-[10px]">Opcional</Badge>}
        </div>
      </button>
      {expanded && (
        <div className="border-t p-4 space-y-3">
          <div className="text-xs text-muted-foreground">
            Slug: <code className="bg-muted px-1 rounded">{phase.slug}</code>
          </div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: phase.content }}
          />
          {phase.resources.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Recursos ({phase.resources.length})
              </p>
              {phase.resources.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{r.resource_type}</Badge>
                  <span className="truncate">{r.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
