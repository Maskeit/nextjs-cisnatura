"use client";
import { useState, useEffect } from 'react';
import { Products } from '@/components/admin/products/Products';
import { ProductCreate } from '@/components/admin/products/ProductCreate';
import { Button } from '@/components/ui/button';
import { Filter, Plus, Trash2, ChevronDown, Check } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import ProductController from '@/lib/ProductController';
import { Category } from '@/interfaces/Products';
import { cn } from "@/lib/utils";

const PRICE_RANGES = [
  { id: 'all', label: 'Todos los precios' },
  { id: '0-100', label: 'Menos de $100' },
  { id: '100-300', label: '$100 - $300' },
  { id: '300-500', label: '$300 - $500' },
  { id: '500+', label: 'Más de $500' },
];


export default function AdminProductosPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [openCategoryPopover, setOpenCategoryPopover] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await ProductController.getCategories({ limit: 100 });
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.error('Error al cargar las categorías');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const id = categoryId === '0' ? undefined : parseInt(categoryId);
    setSelectedCategory(id);
  };

  const handlePriceRangeChange = (rangeId: string) => {
    setSelectedPriceRange(rangeId);
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedPriceRange('all');
  };

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
    setNewCategoryName(name);
    setNewCategorySlug(generateSlug(name));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Por favor ingresa un nombre para la categoría');
      return;
    }

    if (!newCategorySlug.trim()) {
      toast.error('Por favor ingresa un slug para la categoría');
      return;
    }

    setIsAddingCategory(true);
    try {
      const categoryData = {
        name: newCategoryName.trim(),
        slug: newCategorySlug.trim(),
        ...(newCategoryDescription.trim() && { description: newCategoryDescription.trim() }),
      };          
      await ProductController.createCategory(categoryData);
      
      toast.success('Categoría agregada correctamente');
      setNewCategoryName('');
      setNewCategorySlug('');
      setNewCategoryDescription('');
      setIsAddCategoryOpen(false);
      
      // Recargar lista de categorías
      fetchCategories();
    } catch (error: any) {
      console.error('Error al agregar categoría:', error);
      
      let errorMessage = 'Error al agregar la categoría';
      
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
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    try {
      await ProductController.deleteCategory(categoryToDelete.id);
      toast.success('Categoría eliminada correctamente');
      
      // Si la categoría eliminada estaba seleccionada, limpiar el filtro
      if (selectedCategory === categoryToDelete.id) {
        setSelectedCategory(undefined);
      }
      
      // Recargar lista de categorías
      fetchCategories();
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);
      
      let errorMessage = 'Error al eliminar la categoría';
      
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
      setIsDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="py-8">
      {/* Título de sección */}
      <div className="w-full py-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-500">
          CISnatura / <span className="font-normal">Todos los productos</span>
        </h1>
        <Button onClick={() => setIsCreateProductOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Producto
        </Button>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtrar por:</span>
        </div>

        {/* Filtro por Categoría */}
        <div className="flex gap-2">
          <Popover open={openCategoryPopover} onOpenChange={setOpenCategoryPopover}>
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
                          selectedCategory === undefined ? "opacity-100" : "opacity-0"
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
                            selectedCategory === category.id ? "opacity-100" : "opacity-0"
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

        {/* Filtro por Precio */}
        <Select
          value={selectedPriceRange}
          onValueChange={handlePriceRangeChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Precio" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((range) => (
              <SelectItem key={range.id} value={range.id}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Botón limpiar filtros */}
        {(selectedCategory !== undefined || selectedPriceRange !== 'all') && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
      <Products
        selectedCategory={selectedCategory}
        selectedPriceRange={selectedPriceRange}
        onCategoryChange={setSelectedCategory}
        onPriceRangeChange={setSelectedPriceRange}
        onClearFilters={clearFilters}
      />

      {/* Dialog para agregar categoría */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Categoría</DialogTitle>
            <DialogDescription>
              Completa la información de la nueva categoría para los productos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nombre de la categoría</Label>
              <Input
                id="category-name"
                placeholder="Ej: Aceites Esenciales"
                value={newCategoryName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-slug">Slug (URL amigable)</Label>
              <Input
                id="category-slug"
                placeholder="Ej: aceites-esenciales"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se genera automáticamente, pero puedes editarlo
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">Descripción (opcional)</Label>
              <Textarea
                id="category-description"
                placeholder="Describe la categoría..."
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCategoryOpen(false);
                setNewCategoryName('');
                setNewCategorySlug('');
                setNewCategoryDescription('');
              }}
              disabled={isAddingCategory}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddCategory} disabled={isAddingCategory}>
              {isAddingCategory ? 'Agregando...' : 'Agregar Categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear producto */}
      <ProductCreate
        open={isCreateProductOpen}
        onOpenChange={setIsCreateProductOpen}
        onProductCreated={fetchCategories}
      />

      {/* AlertDialog para confirmar eliminación de categoría */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la categoría <strong>{categoryToDelete?.name}</strong>.
              Esta acción no se puede deshacer. Los productos de esta categoría no se eliminarán,
              pero perderán su asignación de categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCategory}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingCategory ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
