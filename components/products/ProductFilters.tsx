'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category } from '@/interfaces/Products';
import {
  PRICE_RANGES,
  PriceRangeId,
  buildCatalogHref,
} from '@/lib/catalog-filters';

interface ProductFiltersProps {
  categories: Category[];
  searchQuery: string;
  selectedCategory?: number;
  selectedPriceRange: PriceRangeId;
}

// Barra de filtros: no tiene estado propio, escribe los filtros en la URL y el
// Server Component de la página vuelve a renderizar el grid.
export default function ProductFilters({
  categories,
  searchQuery,
  selectedCategory,
  selectedPriceRange,
}: ProductFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Cambiar un filtro reinicia la paginación y conserva la búsqueda.
  const navigate = (next: { category?: number; price?: PriceRangeId }) => {
    const href = buildCatalogHref({
      q: searchQuery,
      category: 'category' in next ? next.category : selectedCategory,
      price: next.price ?? selectedPriceRange,
    });
    startTransition(() => router.push(href));
  };

  const handleCategoryChange = (value: string) => {
    navigate({ category: value === '0' ? undefined : parseInt(value, 10) });
  };

  const hasFilters = selectedCategory !== undefined || selectedPriceRange !== 'all';

  return (
    <div
      className="flex flex-wrap items-center gap-2 md:gap-3 pb-3 md:pb-4 border-b mb-4 md:mb-6 aria-busy:opacity-60 transition-opacity"
      aria-busy={isPending}
    >
      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
        <Filter className="h-3 w-3 md:h-4 md:w-4" />
        <span className="font-medium hidden sm:inline">Filtrar por:</span>
      </div>

      {/* Filtro por categoría */}
      <Select value={selectedCategory?.toString() ?? '0'} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[140px] md:w-[200px] h-8 md:h-10 text-xs md:text-sm">
          <SelectValue placeholder="Categoría" />
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

      {/* Filtro por precio */}
      <Select
        value={selectedPriceRange}
        onValueChange={(value) => navigate({ price: value as PriceRangeId })}
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

      <Button asChild>
        <Link href="/protocolos">Ver Protocolos</Link>
      </Button>

      {/* Limpiar filtros (conserva la búsqueda) */}
      {hasFilters && (
        <Button variant="ghost" size="sm" asChild className="h-8 md:h-10 text-xs md:text-sm">
          <Link href={buildCatalogHref({ q: searchQuery })}>
            <span className="hidden sm:inline">Limpiar filtros</span>
            <X className="h-3 w-3 sm:hidden" />
            <span className="sr-only sm:hidden">Limpiar filtros</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
