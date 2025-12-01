"use client";

import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Package, ShoppingBag, Users, Settings } from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const adminMenuItems = [
    {
      title: "Productos",
      href: "/admin/productos",
      icon: Package,
      description: "Gestionar productos y categorías"
    },
    {
      title: "Órdenes",
      href: "/admin/ordenes",
      icon: ShoppingBag,
      description: "Ver y gestionar órdenes"
    },
    {
      title: "Usuarios",
      href: "/admin/users",
      icon: Users,
      description: "Administrar usuarios"
    },
    {
      title: "Configuración",
      href: "/admin/configuration",
      icon: Settings,
      description: "Ajustes del sistema"
    },
  ];

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Navbar />
      <main className="flex flex-col lg:max-w-[2000px] min-h-screen mx-auto px-8">
        {/* Navigation Menu Admin */}
        <div className="w-full pt-6 pb-4 border-b">
          <NavigationMenu>
            <NavigationMenuList>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                
                return (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink asChild>
                      <Link 
                        href={item.href}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "gap-2",
                          isActive && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {children}
      </main>
      <Toaster />
      <Footer />
    </ThemeProvider>
  );
}
