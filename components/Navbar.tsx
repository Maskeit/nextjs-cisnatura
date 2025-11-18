'use client';

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

export default function Navbar() {
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    
    return (
        <header className="w-full flex justify-center bg-white dark:bg-muted/30 z-50 shadow-md">
            <nav className="max-w-[1440px] w-full py-4" aria-label="Navegación principal">
                <div className="flex flex-col md:flex-row md:mx-auto md:items-center gap-3 md:gap-6 px-4 lg:px-0">
                    {/* Fila superior en móvil: Logo y acciones */}
                    <div className="flex items-center justify-between w-full md:w-auto">
                        {/* Menú hamburguesa (mobile) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden text-white hover:bg-white/10 hover:text-white"
                            aria-label="Abrir menú"
                        >
                            <Menu className="w-6 h-6" />
                        </Button>

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
                            {/* Perfil */}
                            {!isLoading && (isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-white hover:bg-white/10 hover:text-white">
                                            <UserCircle className="w-8 h-8 text-gray-500" />
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
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Barra de búsqueda (desktop) */}
                    <div className="hidden md:flex flex-1 w-2xl">
                        <SearchBar
                            placeholder="Buscar productos, cursos, categorías..."
                            inputClassName="h-12 text-base bg-white border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-white/0"
                        />
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
                                        <UserCircle className="w-10 h-10 text-gray-500" />
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
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Barra de búsqueda móvil */}
                <div className="md:hidden pb-5">
                    <SearchBar
                        placeholder="Buscar productos..."
                        inputClassName="h-11 bg-white border-0 shadow-md"
                        isMobile
                    />
                </div>
            </nav>
        </header>
    );
}
