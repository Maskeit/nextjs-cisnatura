import Link from 'next/link';
import ProductCard from './ProductCard';
import { Product, Pagination as PaginationData } from '@/interfaces/Products';
import { buttonVariants } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';
import { CatalogFilters, buildCatalogHref } from '@/lib/catalog-filters';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductsProps {
  products: Product[];
  pagination: PaginationData;
  // Filtros activos: se conservan al construir los enlaces de paginación.
  filters: CatalogFilters;
}

// Números de página a mostrar, con 'ellipsis' en los saltos.
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const maxVisible = 5;
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i);
    pages.push('ellipsis', totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, 'ellipsis');
    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
  }

  return pages;
}

export const Products = ({ products, pagination, filters }: ProductsProps) => {
  const { page: currentPage, total_pages: totalPages } = pagination;
  const pageHref = (page: number) => buildCatalogHref({ ...filters, page });

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Un solo grid responsivo: renderizar dos (móvil y desktop) duplicaría
          cada producto en el HTML que ve el buscador. */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Paginación: enlaces reales, rastreables y con URL propia por página */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {currentPage > 1 ? (
                <Link
                  href={pageHref(currentPage - 1)}
                  rel="prev"
                  aria-label="Página anterior"
                  className={cn(buttonVariants({ variant: 'ghost' }), 'gap-1 px-2.5 sm:pl-2.5')}
                >
                  <ChevronLeft />
                  <span className="hidden sm:block">Anterior</span>
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={cn(buttonVariants({ variant: 'ghost' }), 'gap-1 px-2.5 sm:pl-2.5 pointer-events-none opacity-50')}
                >
                  <ChevronLeft />
                  <span className="hidden sm:block">Anterior</span>
                </span>
              )}
            </PaginationItem>

            {getPageNumbers(currentPage, totalPages).map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <Link
                    href={pageHref(page)}
                    aria-label={`Ir a la página ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={buttonVariants({
                      variant: currentPage === page ? 'outline' : 'ghost',
                      size: 'icon',
                    })}
                  >
                    {page}
                  </Link>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              {currentPage < totalPages ? (
                <Link
                  href={pageHref(currentPage + 1)}
                  rel="next"
                  aria-label="Página siguiente"
                  className={cn(buttonVariants({ variant: 'ghost' }), 'gap-1 px-2.5 sm:pr-2.5')}
                >
                  <span className="hidden sm:block">Siguiente</span>
                  <ChevronRight />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={cn(buttonVariants({ variant: 'ghost' }), 'gap-1 px-2.5 sm:pr-2.5 pointer-events-none opacity-50')}
                >
                  <span className="hidden sm:block">Siguiente</span>
                  <ChevronRight />
                </span>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Información de resultados */}
      <div className="text-center text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} • {products.length} productos mostrados
      </div>
    </div>
  );
};
