'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from '@/components/ModeToggle';
import SearchBar from '@/components/SearchBar';
import { ShoppingCart, UserCircle, Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CartController from '@/lib/CartController';
import { Badge } from '@/components/ui/badge';

function SearchBarFallback({ isMobile = false }: { isMobile?: boolean }) {
    return (
        <div className={`w-full ${isMobile ? 'h-11' : 'h-12'} bg-muted animate-pulse rounded-md`} />
    );
}

export default function Navbar() {
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    const [cartItemCount, setCartItemCount] = useState<number>(0);

    // Función para actualizar el contador del carrito (memorizada con useCallback)
    const updateCartCount = useCallback(async () => {
        if (!isAuthenticated || isLoading) {
            setCartItemCount(0);
            return;
        }
        
        try {
            const response = await CartController.getSummary();
            if (response.success) {
                setCartItemCount(response.data.total_items);
            }
        } catch (error: any) {
            // Si hay error (por ejemplo 401 o AUTHENTICATION_REQUIRED), simplemente no mostrar contador
            // No mostrar toast aquí para evitar spam de mensajes
            if (error.response?.status === 401 || error.response?.data?.error === 'AUTHENTICATION_REQUIRED') {
                setCartItemCount(0);
            }
        }
    }, [isAuthenticated, isLoading]);

    // Cargar el contador al montar y cuando cambie la autenticación
    useEffect(() => {
        updateCartCount();
    }, [isAuthenticated, isLoading]);

    // Escuchar eventos de actualización del carrito
    useEffect(() => {
        if (!isAuthenticated) return;
        
        const handleCartUpdate = () => {
            updateCartCount();
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, [isAuthenticated, updateCartCount]);
    
    return (
        <header className="w-full flex justify-center bg-white dark:bg-muted/30 z-50 shadow-md">
            <nav className="max-w-[1440px] w-full py-4 px-6" aria-label="Navegación principal">
                <div className="flex flex-col md:flex-row md:mx-auto md:items-center gap-3 md:gap-6 px-4 lg:px-0">
                    {/* Fila superior en móvil: Logo y acciones */}
                    <div className="flex items-center justify-between w-full md:w-auto">
                        {/* Menú hamburguesa (mobile) */}

                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0" aria-label="Ir a la página de inicio">
                            <Image
                                src="/logocis.svg"
                                alt="Cisnatura Logo"
                                width={180}
                                height={60}
                                className="h-14 w-auto"
                                priority
                            />
                        </Link>

                        {/* Iconos de navegación (móvil) */}
                        <div className="flex items-center gap-2 md:hidden">
                            {/* Toggle Theme */}
                            <ModeToggle />
                            
                            {/* Perfil */}
                            {!isLoading && (isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-white hover:bg-white/10 hover:text-white">
                                            {user?.profile_image ? (
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                                    <img
                                                        src={user.profile_image}
                                                        alt={user.full_name || 'Usuario'}
                                                        className="object-cover w-full h-full"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                </div>
                                            ) : (
                                                <UserCircle className="w-8 h-8 text-gray-500" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end">
                                        <DropdownMenuLabel>
                                            {user?.full_name || 'Mi Cuenta'}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/perfil" className="flex items-center cursor-pointer">
                                                <User className="mr-2 h-4 w-4" />
                                                Perfil
                                            </Link>
                                        </DropdownMenuItem>
                                        {user?.is_admin && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/productos" className="flex items-center cursor-pointer">
                                                    <User className="mr-2 h-4 w-4" />
                                                    Panel Admin
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout} className="cursor-pointer">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Cerrar Sesión
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-primary">
                                    <Link href="/login">
                                        Iniciar Sesión
                                    </Link>
                                </Button>
                            ))}

                            {/* Carrito */}
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="relative text-white hover:bg-white/10 hover:text-white">
                                <Link href="/carrito" aria-label="Ver carrito de compras">
                                    <ShoppingCart className="w-6 h-6 text-gray-500" />
                                    {cartItemCount > 0 && (
                                        <Badge 
                                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                            variant="destructive"
                                        >
                                            {cartItemCount > 99 ? '99+' : cartItemCount}
                                        </Badge>
                                    )}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Barra de búsqueda (desktop) */}
                    <div className="hidden md:flex flex-1 w-2xl">
                        <Suspense fallback={<SearchBarFallback />}>
                            <SearchBar
                                placeholder="Buscar productos, cursos, categorías..."
                                inputClassName="h-12 text-base bg-white border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-white/0"
                            />
                        </Suspense>
                    </div>

                    {/* Iconos de navegación (desktop) */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Toggle Theme */}
                        <ModeToggle />
                        
                        {/* Perfil */}
                        {!isLoading && (isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/10 hover:text-white">
                                        {user?.profile_image ? (
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                                <img
                                                    src={user.profile_image}
                                                    alt={user.full_name || 'Usuario'}
                                                    className="object-cover w-full h-full"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        ) : (
                                            <UserCircle className="w-10 h-10 text-gray-500" />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuLabel>
                                        {user?.full_name || 'Mi Cuenta'}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/perfil" className="flex items-center cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            Perfil
                                        </Link>
                                    </DropdownMenuItem>
                                    {user?.is_admin && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin/productos" className="flex items-center cursor-pointer">
                                                <User className="mr-2 h-4 w-4" />
                                                Panel Admin
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Cerrar Sesión
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild variant="ghost" className="text-gray-600 hover:text-primary">
                                <Link href="/login">
                                    Iniciar Sesión
                                </Link>
                            </Button>
                        ))}

                        {/* Carrito */}
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="relative text-white hover:bg-white/10 hover:text-white h-11 w-11">
                            <Link href="/carrito" aria-label="Ver carrito de compras">
                                <ShoppingCart className="w-6 h-6 text-gray-500" />
                                {cartItemCount > 0 && (
                                    <Badge 
                                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                        variant="destructive"
                                    >
                                        {cartItemCount > 99 ? '99+' : cartItemCount}
                                    </Badge>
                                )}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Barra de búsqueda móvil */}
                <div className="md:hidden pb-5">
                    <Suspense fallback={<SearchBarFallback isMobile />}>
                        <SearchBar
                            placeholder="Buscar productos..."
                            inputClassName="h-11 bg-white border-0 shadow-md"
                            isMobile
                        />
                    </Suspense>
                </div>
            </nav>
        </header>
    );
}
