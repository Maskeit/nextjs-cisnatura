'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/admin/products/ProductCard';
import { Product } from '@/interfaces/Products';
import ProductController from '@/lib/ProductController';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ProductsProps {
  selectedCategory?: number;
  selectedPriceRange?: string;
  onCategoryChange: (categoryId: number | undefined) => void;
  onPriceRangeChange: (rangeId: string) => void;
  onClearFilters: () => void;
}

export const Products = ({
  selectedCategory,
  selectedPriceRange = 'all',
}: ProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async (page: number) => {
    setIsLoading(true);
    try {
      // Obtener min/max del rango de precios
      let minPrice: number | undefined;
      let maxPrice: number | undefined;
      
      if (selectedPriceRange === '0-100') {
        minPrice = 0;
        maxPrice = 100;
      } else if (selectedPriceRange === '100-300') {
        minPrice = 100;
        maxPrice = 300;
      } else if (selectedPriceRange === '300-500') {
        minPrice = 300;
        maxPrice = 500;
      } else if (selectedPriceRange === '500+') {
        minPrice = 500;
        maxPrice = undefined;
      }
      
      const response = await ProductController.adminListAll({
        page,
        limit: 20,
        category_id: selectedCategory,
        min_price: minPrice,
        max_price: maxPrice,
      });
      
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.total_pages);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, selectedCategory, selectedPriceRange]);

  const handleProductUpdated = () => {
    fetchProducts(currentPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid de productos - 5 columnas en desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            onProductUpdated={handleProductUpdated}
          />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {/* Botón Anterior */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {/* Números de página */}
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page as number);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            {/* Botón Siguiente */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) handlePageChange(currentPage + 1);
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
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
}
