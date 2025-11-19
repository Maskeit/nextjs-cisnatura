"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Products } from "@/components/products/Products"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ProductController from '@/lib/ProductController'
import { Category } from '@/interfaces/Products'
import { toast } from "sonner"

const PRICE_RANGES = [
  { id: 'all', label: 'Todos los precios' },
  { id: '0-100', label: 'Menos de $100' },
  { id: '100-300', label: '$100 - $300' },
  { id: '300-500', label: '$300 - $500' },
  { id: '500+', label: 'Más de $500' },
];

export default function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

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

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8">
      {/* Título de sección */}
      <div className="w-full py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Cisnatura / <span className="font-normal">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Todos los productos'}
          </span>
        </h1>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtrar por:</span>
        </div>

        {/* Filtro por Categoría */}
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

      {/* Productos */}
      <Products 
        selectedCategory={selectedCategory}
        selectedPriceRange={selectedPriceRange}
        searchQuery={searchQuery}
        onCategoryChange={setSelectedCategory}
        onPriceRangeChange={setSelectedPriceRange}
        onClearFilters={clearFilters}
      />
    </div>
  )
}
