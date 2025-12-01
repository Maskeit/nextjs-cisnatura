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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Evitar hidratación mismatch
  useEffect(() => {
    setMounted(true);
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

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

  // Prevenir render hasta que el componente esté montado en el cliente
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen px-3 md:px-6 pt-4 md:pt-8">
      {/* Título de sección */}
      <div className="w-full py-3 md:py-6">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-zinc-400">
          CISnatura / <span className="font-normal">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Todos los productos'}
          </span>
        </h1>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 pb-3 md:pb-4 border-b mb-4 md:mb-6">
        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
          <Filter className="h-3 w-3 md:h-4 md:w-4" />
          <span className="font-medium hidden sm:inline">Filtrar por:</span>
        </div>

        {/* Filtro por Categoría */}
        <Select
          value={selectedCategory?.toString() || '0'}
          onValueChange={handleCategoryChange}
          disabled={isLoadingCategories}
        >
          <SelectTrigger className="w-[140px] md:w-[200px] h-8 md:h-10 text-xs md:text-sm">
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
          <SelectTrigger className="w-[140px] md:w-[200px] h-8 md:h-10 text-xs md:text-sm">
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
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 md:h-10 text-xs md:text-sm">
            <span className="hidden sm:inline">Limpiar filtros</span>
            <X className="h-3 w-3 sm:hidden" />
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
