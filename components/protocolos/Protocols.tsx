'use client';
import { useState, useEffect, useCallback } from 'react';
import { ProtocolCard } from './ProtocolCard';
import { ProtocolListItem, ProtocolCategory } from '@/interfaces/Protocol';
import ProtocolController from '@/lib/ProtocolController';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ProtocolsProps {
  selectedCategory?: number;
  searchQuery?: string;
  featuredOnly?: boolean;
  onCategoryChange?: (categoryId: number | undefined) => void;
  onSearchQueryChange?: (query: string) => void;
  onFeaturedOnlyChange?: (featuredOnly: boolean) => void;
  onClearFilters?: () => void;
}

export const Protocols = ({
  searchQuery,
  selectedCategory,
}: ProtocolsProps) => {
  const { isAuthenticated } = useAuth();

  const [protocols, setProtocols] = useState<ProtocolListItem[]>([]);
  const [categories, setCategories] = useState<ProtocolCategory[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<number>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(selectedCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar categorías una sola vez
  useEffect(() => {
    ProtocolController.fetchPublicCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Cargar protocolos comprados si el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      setOwnedIds(new Set());
      return;
    }
    ProtocolController.getMyProtocols()
      .then((accesses) => setOwnedIds(new Set(accesses.map((a) => a.protocol_id))))
      .catch(() => {});
  }, [isAuthenticated]);

  const fetchProtocols = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const result = await ProtocolController.fetchProtocols({
          page,
          limit: 12,
          category_id: activeCategoryId,
          search: searchQuery,
        });
        setProtocols(result.protocols);
        setTotalPages(result.pagination.total_pages);
      } catch (error) {
        console.error('Error al cargar protocolos:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [activeCategoryId, searchQuery]
  );

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryId, searchQuery]);

  useEffect(() => {
    fetchProtocols(currentPage);
  }, [fetchProtocols, currentPage]);

  // Sincronizar prop externa de categoría
  useEffect(() => {
    setActiveCategoryId(selectedCategory);
  }, [selectedCategory]);

  const visiblePages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  return (
    <div className="space-y-6">
      {/* Filtro de categorías */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategoryId === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategoryId(undefined)}
          >
            Todos
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategoryId === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                setActiveCategoryId(activeCategoryId === cat.id ? undefined : cat.id)
              }
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      {/* Grid de protocolos */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : protocols.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No se encontraron protocolos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {protocols.map((protocol) => (
            <ProtocolCard
              key={protocol.id}
              protocolo={protocol}
              isOwned={ownedIds.has(protocol.id)}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {!isLoading && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage((p) => p - 1);
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {visiblePages()[0] > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}>
                    1
                  </PaginationLink>
                </PaginationItem>
                {visiblePages()[0] > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
              </>
            )}

            {visiblePages().map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === page}
                  onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {visiblePages()[visiblePages().length - 1] < totalPages && (
              <>
                {visiblePages()[visiblePages().length - 1] < totalPages - 1 && (
                  <PaginationItem><PaginationEllipsis /></PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
