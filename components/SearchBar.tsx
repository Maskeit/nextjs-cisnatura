'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  isMobile?: boolean;
}

export default function SearchBar({ 
  placeholder = "Buscar productos...", 
  className = "",
  inputClassName = "",
  isMobile = false
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      // Navegar a la página principal con el parámetro de búsqueda
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // Si está vacío, limpiar la búsqueda
      router.push('/');
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    router.push('/');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`} role="search">
      <Input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full pl-4 ${searchQuery ? 'pr-20' : 'pr-14'} ${inputClassName}`}
        aria-label="Buscar en el sitio"
      />
      
      {/* Botón para limpiar */}
      {searchQuery && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleClear}
          className={`absolute ${isMobile ? 'right-10' : 'right-12'} top-1/2 -translate-y-1/2 h-8 w-8`}
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      {/* Botón de búsqueda */}
      <Button
        type="submit"
        size="icon"
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-light ${isMobile ? 'h-8 w-8' : 'h-9 w-9'}`}
        aria-label="Buscar"
      >
        <Search className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
      </Button>
    </form>
  );
}
