"use client";
import { useState, useEffect } from 'react';
import { Products } from '@/components/admin/products/Products';
import { ProductCreate } from '@/components/admin/products/ProductCreate';
import { Button } from '@/components/ui/button';
import { Filter, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
          <Select
            value={selectedCategory?.toString() || '0'}
            onValueChange={handleCategoryChange}
            disabled={isLoadingCategories}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={isLoadingCategories ? "Cargando..." : "Categoría"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </div>
  );
}
