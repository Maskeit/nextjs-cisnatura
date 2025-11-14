import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from '@/components/ModeToggle';
import { Search, ShoppingCart, UserCircle, Menu } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="w-full flex justify-center bg-white z-50 shadow-md">
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
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        Profile
                                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        Log out
                                        <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

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
                        <form className="relative w-full" role="search">
                            <Input
                                type="search"
                                placeholder="Buscar productos, cursos, categorías..."
                                className="w-full h-12 pl-4 pr-14 text-base bg-white border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-white/0"
                                aria-label="Buscar en el sitio"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-light h-9 w-9"
                                aria-label="Buscar"
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>

                    {/* Iconos de navegación (desktop) */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Toggle Theme */}
                        <ModeToggle />
                        
                        {/* Perfil */}
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
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuItem>
                                    Profile
                                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    Log out
                                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

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
                    <form className="relative w-full" role="search">
                        <Input
                            type="search"
                            placeholder="Buscar productos..."
                            className="w-full h-11 pl-4 pr-12 bg-white border-0 shadow-md"
                            aria-label="Buscar en el sitio"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-light h-8 w-8"
                            aria-label="Buscar"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </nav>
        </header>
    );
}
