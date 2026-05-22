"use client";

import { useState, useEffect } from "react";
import AdminProtocolCard from "./ProtocolCard";
import { Protocol } from "@/interfaces/Protocol";
import ProtocolController from "@/lib/ProtocolController";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ProtocolsProps {
  filterPublished?: "all" | "published" | "draft";
}

export const Protocols = ({ filterPublished = "all" }: ProtocolsProps) => {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 20;

  const fetchProtocols = async (page: number) => {
    setIsLoading(true);
    try {
      const is_published =
        filterPublished === "published" ? true :
        filterPublished === "draft" ? false :
        undefined;

      const response = await ProtocolController.adminListAll({
        page,
        limit,
        is_published,
      });

      setProtocols(response.data.protocols);
      setTotalPages(response.data.pagination.total_pages);
    } catch (error) {
      console.error("Error cargando protocolos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols(currentPage);
  }, [currentPage, filterPublished]);

  const handleProtocolUpdated = () => {
    fetchProtocols(currentPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (protocols.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">No se encontraron protocolos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {protocols.map((protocol) => (
          <AdminProtocolCard
            key={protocol.id}
            protocol={protocol}
            onProtocolUpdated={handleProtocolUpdated}
          />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === "ellipsis" ? (
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
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) handlePageChange(currentPage + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} • {protocols.length} protocolos mostrados
      </div>
    </div>
  );
};
