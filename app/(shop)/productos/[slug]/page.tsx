"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/interfaces/Products';
import ProductController from '@/lib/ProductController';
import CartController from '@/lib/CartController';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      // Obtener el producto por slug usando el endpoint correcto
      const response = await ProductController.getProductBySlug(slug);
      
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        toast.error('Producto no encontrado');
        router.push('/');
      }
    } catch (error) {
      console.error('Error al cargar producto:', error);
      toast.error('Error al cargar el producto');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      const response = await CartController.addItem({
        product_id: product.id,
        quantity: quantity,
      });
      
      if (response.success) {
        toast.success(`${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito`);
        // Disparar evento para actualizar el contador del navbar
        window.dispatchEvent(new Event('cartUpdated'));
        // Resetear cantidad
        setQuantity(1);
      }
    } catch (error: any) {
      console.error('Error al agregar al carrito:', error);
      
      // Si es 401, redirigir a login
      if (error.response?.status === 401) {
        toast.error('Debes iniciar sesión para agregar productos al carrito');
        router.push('/login');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error al agregar el producto al carrito');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(product.price);

  const isOutOfStock = product.stock === 0;

  // Construir URL de imagen de forma consistente
  const imageUrl = product.image_url
    ? `${process.env.NEXT_PUBLIC_API_URL}${product.image_url}`
    : '/placeholder.png';

  const hasImage = !!product.image_url;

  return (
    <div className="min-h-screen px-6 py-8">
      {/* Breadcrumb y botón de regreso */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Button>
        </Link>
      </div>

      {/* Grid principal */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
        {/* Columna izquierda - Imagen */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={hasImage}
            priority
            key={product.image_url || 'placeholder'}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-white px-6 py-3 rounded-lg font-semibold text-lg">
                Agotado
              </span>
            </div>
          )}
          {/* Badge de descuento */}
          {product.has_discount && product.discount && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-2xl shadow-lg">
              -{product.discount.discount_percentage}%
            </div>
          )}
        </div>

        {/* Columna derecha - Información */}
        <div className="flex flex-col space-y-6">
          {/* Título */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {product.name}
            </h1>
            
            {/* Stock badge */}
            <div>
              {isOutOfStock ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-destructive/10 text-destructive">
                  Sin stock
                </span>
              ) : product.stock < 10 ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                  ¡Solo quedan {product.stock}!
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                  Disponible
                </span>
              )}
            </div>
          </div>

          {/* Precio */}
          <div className="border-y py-6">
            {product.has_discount && product.discount ? (
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-primary">
                    {formattedPrice}
                  </span>
                  <span className="text-3xl text-muted-foreground line-through">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(product.discount.original_price)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                    🎉 {product.discount.discount_name}
                  </span>
                  <span className="text-base text-muted-foreground">
                    (Ahorras {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(product.discount.savings)})
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-primary">
                  {formattedPrice}
                </span>
                <span className="text-xl text-muted-foreground">MXN</span>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Descripción
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {product.description || 'No hay descripción disponible para este producto.'}
            </p>
          </div>

          {/* Selector de cantidad */}
          {!isOutOfStock && (
            <div>
              <label className="text-lg font-medium text-foreground mb-3 block">
                Cantidad
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="h-12 w-12"
                >
                  -
                </Button>
                <span className="text-2xl font-semibold w-16 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock}
                  className="h-12 w-12"
                >
                  +
                </Button>
                <span className="text-sm text-muted-foreground ml-4">
                  {product.stock} disponibles
                </span>
              </div>
            </div>
          )}

          {/* Botón de agregar al carrito */}
          <div className="pt-4">
            <Button
              size="lg"
              disabled={isOutOfStock || isAddingToCart}
              onClick={handleAddToCart}
              className="w-full h-16 text-xl"
            >
              {isAddingToCart ? (
                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
              ) : (
                <ShoppingCart className="h-6 w-6 mr-3" />
              )}
              {isOutOfStock ? 'No disponible' : isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
            </Button>
          </div>

          {/* Información adicional */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              Detalles del producto
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-base text-muted-foreground">SKU</span>
                <span className="text-base font-medium">{product.slug}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-base text-muted-foreground">Stock disponible</span>
                <span className="text-base font-medium">{product.stock} unidades</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
