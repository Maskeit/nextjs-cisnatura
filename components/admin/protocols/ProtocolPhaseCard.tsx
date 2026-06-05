"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Edit, Plus, X, FileText } from "lucide-react";
import { toast } from "sonner";
import ProtocolController from "@/lib/ProtocolController";
import { ProtocolPhase, ResourceType } from "@/interfaces/Protocol";
import { FileUpload } from "@/components/admin/protocols/FileUpload";
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

/** Tarjeta de fase editables dentro de la pestaña Fases */
export function PhaseCard({
  phase,
  index,
  protocolId,
  onUpdated,
}: {
  phase: ProtocolPhase;
  index: number;
  protocolId: number;
  onUpdated?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [pendingResourceUrl, setPendingResourceUrl] = useState<string | null>(null);
  const [newResType, setNewResType] = useState<ResourceType>(ResourceType.PDF);
  const [newResTitle, setNewResTitle] = useState("");
  const [newResUrl, setNewResUrl] = useState("");

  const [formData, setFormData] = useState({
    title: phase.title,
    slug: phase.slug,
    description: phase.description || "",
    content: phase.content,
    duration_minutes: phase.duration_minutes || 0,
    is_required: phase.is_required,
    order: phase.order,
    resources: phase.resources || [],
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const phaseUpdate = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || undefined,
        content: formData.content,
        duration_minutes: formData.duration_minutes || undefined,
        is_required: formData.is_required,
        order: formData.order,
        resources: (formData.resources || []).map(r => ({
          resource_type: r.resource_type,
          title: r.title,
          description: r.description || undefined,
          url: r.url,
          order: r.order,
          is_visible: r.is_visible,
        })),
      };

      await ProtocolController.adminUpdatePhase(
        protocolId,
        phase.id,
        phaseUpdate,
      );
      toast.success("Fase actualizada");
      setIsEditing(false);
      onUpdated?.();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al actualizar fase";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await ProtocolController.adminDeletePhase(protocolId, phase.id);
      toast.success("Fase eliminada");
      setDeleteDialogOpen(false);
      onUpdated?.();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al eliminar fase";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: phase.title,
      slug: phase.slug,
      description: phase.description || "",
      content: phase.content,
      duration_minutes: phase.duration_minutes || 0,
      is_required: phase.is_required,
      order: phase.order,
      resources: phase.resources || [],
    });
    setIsEditing(false);
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <button
          type="button"
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{formData.title}</p>
            {formData.description && (
              <p className="text-xs text-muted-foreground truncate">
                {formData.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {formData.duration_minutes > 0 && (
              <span>{formData.duration_minutes} min</span>
            )}
            {!formData.is_required && (
              <Badge variant="outline" className="text-[10px]">
                Opcional
              </Badge>
            )}
          </div>
        </button>

        {expanded && (
          <div className="border-t p-4 space-y-4">
            {!isEditing ? (
              <>
                {/* Vista previa */}
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Slug:{" "}
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {formData.slug}
                    </code>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Duración:{" "}
                    <span>{formData.duration_minutes || 0} minutos</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Requerida: <span>{formData.is_required ? "Sí" : "No"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recursos: <span>{formData.resources?.length ? "Sí" : "No"}</span>
                  </div>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-sm bg-muted/50 p-3 rounded"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                  {(phase.resources?.length ?? 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Recursos ({phase.resources!.length})
                      </p>
                      {phase.resources!.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Badge variant="outline" className="text-[10px]">
                            {r.resource_type}
                          </Badge>
                          <span className="truncate">{r.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Formulario de edición */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Título</label>
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Título de la fase"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug</label>
                      <Input
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="titulo-de-la-fase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descripción breve de la fase"
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Contenido (HTML)
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Contenido HTML de la fase"
                      className="min-h-[150px] font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Duración (minutos)
                      </label>
                      <Input
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration_minutes: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2 flex items-end">
                      <label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_required}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_required: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        Requerida
                      </label>
                    </div>
                  </div>

                  {/* Recursos */}
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Recursos ({formData.resources.length})
                    </p>
                    {formData.resources.map((r, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 bg-muted/30 p-2 rounded text-xs">
                        <FileText className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <Badge variant="outline" className="text-[10px]">{r.resource_type}</Badge>
                        <span className="flex-1 truncate">{r.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              resources: formData.resources.filter((_, i) => i !== rIdx),
                            })
                          }
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Tipo</label>
                        <select
                          value={newResType}
                          onChange={(e) => setNewResType(e.target.value as ResourceType)}
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
                          value={newResTitle}
                          onChange={(e) => setNewResTitle(e.target.value)}
                          placeholder="Mi recurso"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Input
                        value={newResUrl}
                        onChange={(e) => setNewResUrl(e.target.value)}
                        placeholder="URL o sube un archivo"
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (pendingResourceUrl) setNewResUrl(pendingResourceUrl);
                          setFileUploadOpen(true);
                        }}
                        className="h-8 text-xs px-2"
                      >
                        Subir
                      </Button>
                    </div>
                    {pendingResourceUrl && !newResUrl && (
                      <p className="text-xs text-green-700">✓ Archivo subido — se usará como URL</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = newResUrl || pendingResourceUrl || "";
                        if (!newResTitle || !url) {
                          toast.error("Completa título y URL");
                          return;
                        }
                        setFormData({
                          ...formData,
                          resources: [
                            ...formData.resources,
                            {
                              id: -Date.now(),
                              resource_type: newResType,
                              title: newResTitle,
                              description: null,
                              url,
                              order: formData.resources.length,
                              is_visible: true,
                              created_at: "",
                            },
                          ],
                        });
                        setNewResTitle("");
                        setNewResUrl("");
                        setNewResType(ResourceType.PDF);
                        setPendingResourceUrl(null);
                      }}
                      className="w-full h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Agregar recurso
                    </Button>
                  </div>

                  {/* Botones de guardado */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* File upload for resources */}
      <FileUpload
        open={fileUploadOpen}
        onOpenChange={setFileUploadOpen}
        onFileUploaded={(url) => {
          setNewResUrl(url);
          setPendingResourceUrl(url);
          setFileUploadOpen(false);
        }}
        accept="any"
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ⚠️ ¿Eliminar fase?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <span className="block">
                  Se eliminará la fase{" "}
                  <strong>&quot;{formData.title}&quot;</strong> permanentemente.
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
}
