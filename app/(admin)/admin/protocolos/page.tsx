"use client";

import { useState, useEffect } from "react";
import { Protocols } from "@/components/admin/protocols/Protocols";
import { ProtocolCreateDialog } from "@/components/admin/protocols/ProtocolCreate";
import { Button } from "@/components/ui/button";
import { Filter, Plus, Trash2, ChevronDown, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateSlug, cn } from "@/lib/utils";
import { ProtocolCategory } from "@/interfaces/Protocol";
import ProtocolController from "@/lib/ProtocolController";

export default function AdminProtocolsPage() {
  const [filterPublished, setFilterPublished] = useState<
    "all" | "published" | "draft"
  >("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined,
  );
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categories, setCategories] = useState<ProtocolCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [openCategoryPopover, setOpenCategoryPopover] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ProtocolCategory | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await ProtocolController.adminListCategories();
      setCategories(response);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      toast.error("Error al cargar las categorías");
    } finally {
      setIsLoadingCategories(false);
    }
  };
  const handleCategoryChange = (categoryId: string) => {
    const id = categoryId === "0" ? undefined : parseInt(categoryId);
    setSelectedCategory(id);
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
  };

  const handleProtocolCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleNameChange = (name: string) => {
    setNewCategoryName(name);
    setNewCategorySlug(generateSlug(name));
  };
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Por favor ingresa un nombre para la categoría");
      return;
    }

    if (!newCategorySlug.trim()) {
      toast.error("Por favor ingresa un slug para la categoría");
      return;
    }
    setIsAddingCategory(true);
    try {
      await ProtocolController.adminCreateProtocolCategory(
        newCategoryName.trim(),
        newCategorySlug.trim(),
      );
      toast.success("Categoría agregada correctamente");
      setNewCategoryName("");
      setNewCategorySlug("");
      setIsAddCategoryOpen(false);

      // Recargar lista de categorías
      fetchCategories();
    } catch (error: any) {
      console.error("Error al agregar categoría:", error);
      let errorMessage = "Error al agregar la categoría";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (typeof errorDetail === "object" && errorDetail.message) {
          errorMessage = errorDetail.message;
        } else if (typeof errorDetail === "string") {
          errorMessage = errorDetail;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    try {
      await ProtocolController.adminDeleteProtocolCategory(categoryToDelete.id);
      toast.success("Categoría eliminada correctamente");

      // Si la categoría eliminada estaba seleccionada, limpiar el filtro
      if (selectedCategory === categoryToDelete.id) {
        setSelectedCategory(undefined);
      }

      // Recargar lista de categorías
      fetchCategories();
    } catch (error: any) {
      console.error("Error al eliminar categoría:", error);

      let errorMessage = "Error al eliminar la categoría";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (typeof errorDetail === "object" && errorDetail.message) {
          errorMessage = errorDetail.message;
        } else if (typeof errorDetail === "string") {
          errorMessage = errorDetail;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };
  return (
    <div className="py-8">
      {/* Título */}
      <div className="w-full py-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-500">
          CISnatura / <span className="font-normal">Protocolos</span>
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Protocolo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtrar por:</span>
        </div>

        <Select
          value={filterPublished}
          onValueChange={(v) =>
            setFilterPublished(v as "all" | "published" | "draft")
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
          </SelectContent>
        </Select>

        {filterPublished !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterPublished("all")}
          >
            Limpiar filtros
          </Button>
        )}

        {/* Filtro por Categoría */}
        <div className="flex gap-2">
          <Popover
            open={openCategoryPopover}
            onOpenChange={setOpenCategoryPopover}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCategoryPopover}
                className="w-[200px] justify-between"
                disabled={isLoadingCategories}
              >
                {selectedCategory
                  ? categories.find((cat) => cat.id === selectedCategory)?.name
                  : "Todas las categorías"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Buscar categoría..." />
                <CommandList>
                  <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="0"
                      onSelect={() => {
                        setSelectedCategory(undefined);
                        setOpenCategoryPopover(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCategory === undefined
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      Todas las categorías
                    </CommandItem>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => {
                          setSelectedCategory(category.id);
                          setOpenCategoryPopover(false);
                        }}
                        className="group"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCategory === category.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span className="flex-1">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryToDelete(category);
                            setOpenCategoryPopover(false);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAddCategoryOpen(true)}
            title="Agregar nueva categoría"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Lista de protocolos */}
      <Protocols key={refreshKey} filterPublished={filterPublished} />

      {/* Dialog para agregar categoría */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Categoría</DialogTitle>
            <DialogDescription>
              Completa la información de la nueva categoría para los Protocolos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nombre de la categoría</Label>
              <Input
                id="category-name"
                placeholder="Ej: Sistemas Digestivos"
                value={newCategoryName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sistema-digestivos">Slug (URL amigable)</Label>
              <Input
                id="category-slug"
                placeholder="Ej: sistema-digestivos"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se genera automáticamente, pero puedes editarlo
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCategoryOpen(false);
                setNewCategoryName("");
                setNewCategorySlug("");
                setNewCategoryDescription("");
              }}
              disabled={isAddingCategory}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddCategory} disabled={isAddingCategory}>
              {isAddingCategory ? "Agregando..." : "Agregar Categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar eliminación de categoría */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la categoría{" "}
              <strong>{categoryToDelete?.name}</strong>. Esta acción no se puede
              deshacer. Los productos de esta categoría no se eliminarán, pero
              perderán su asignación de categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCategory}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingCategory ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog crear protocolo */}
      <ProtocolCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onProtocolCreated={handleProtocolCreated}
      />
    </div>
  );
}
