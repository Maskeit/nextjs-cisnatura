'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CartController from '@/lib/CartController';
import { Cart } from '@/interfaces/Cart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CarritoPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const response = await CartController.getCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar el carrito:', error);
      
      // Si el error es 401 o AUTHENTICATION_REQUIRED, redirigir a login
      if (error.response?.status === 401 || error.response?.data?.error === 'AUTHENTICATION_REQUIRED') {
        toast.info('Inicia sesión para ver tu carrito');
        router.push('/login');
      } else {
        toast.error('Error al cargar el carrito');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    try {
      const response = await CartController.updateItem(productId, { quantity });
      if (response.success) {
        setCart(response.data);
        // Disparar evento para actualizar el contador del navbar
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error: any) {
      console.error('Error al actualizar cantidad:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error al actualizar la cantidad');
      }
      
      // Recargar el carrito para mantener consistencia
      fetchCart();
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      const response = await CartController.removeItem(productId);
      if (response.success) {
        setCart(response.data);
        // Disparar evento para actualizar el contador del navbar
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.error('Error al eliminar el producto');
      fetchCart();
    }
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      const response = await CartController.clearCart();
      if (response.success) {
        setCart(response.data);
        toast.success('Carrito vaciado correctamente');
        // Disparar evento para actualizar el contador del navbar
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error al vaciar el carrito:', error);
      toast.error('Error al vaciar el carrito');
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="min-h-screen px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Seguir comprando
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">Carrito</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground">Domicilio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground">Resumen de orden</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-400">
            Carrito de Compras
          </h1>
          
          {!isEmpty && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isClearing}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Vaciar carrito
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Vaciar carrito?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará todos los productos de tu carrito. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearCart}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Vaciar carrito
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {isEmpty ? (
          // Carrito vacío
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-24 w-24 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-zinc-400 dark:text-zinc-200">Tu carrito está vacío</h2>
            <p className="text-muted-foreground mb-6">
              Agrega productos para comenzar tu compra
            </p>
            <Link href="/">
              <Button size="lg">
                Explorar productos
              </Button>
            </Link>
          </div>
        ) : (
          // Carrito con productos
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border p-4 md:p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Productos ({cart.total_items})
                </h2>
                <div className="space-y-0">
                  {cart.items.map((item) => (
                    <CartItem
                      key={`cart-item-${item.product_id}`}
                      item={item}
                      onUpdate={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="lg:col-span-1">
              <CartSummary
                subtotal={cart.total_amount}
                totalItems={cart.total_items}
                totalDiscount={cart.total_discount}
                totalWithoutDiscount={cart.total_without_discount}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
