'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/interfaces/Products';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { ProductEdit } from './ProductEdit';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import ProductController from '@/lib/ProductController';

interface ProductCardProps {
  product: Product;
  onProductUpdated?: () => void;
}

export default function ProductCard({ product, onProductUpdated }: ProductCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(product.price);

  const isOutOfStock = product.stock === 0;
  const isInactive = product.is_active === false;

  // Construir URL completa de la imagen
  const imageUrl = product.image_url 
    ? `${process.env.NEXT_PUBLIC_API_URL}${product.image_url}`
    : '/placeholder.png';
  
  const hasImage = !!product.image_url;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await ProductController.adminDelete(product.id);
      toast.success('Producto eliminado correctamente');
      if (onProductUpdated) onProductUpdated();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar el producto';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={`group overflow-hidden transition-all hover:shadow-lg ${isInactive ? 'opacity-60' : ''}`}>
        {/* Imagen del producto */}
        <div className="block relative aspect-square overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized={hasImage}
            priority={false}
            key={product.image_url || 'placeholder'}
          />
          {isInactive && (
            <div className="absolute top-2 right-2">
              <span className="bg-destructive text-white px-2 py-1 rounded text-xs font-semibold">
                Inactivo
              </span>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-white px-4 py-2 rounded-lg font-semibold">
                Agotado
              </span>
            </div>
          )}
        </div>

        <CardContent className="pt-4">
          {/* Nombre del producto */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">
              {product.name}
            </h3>
          </div>

        {/* Descripción (opcional) */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Precio */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-primary">
            {formattedPrice}
          </span>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-2 text-sm">
          {isOutOfStock ? (
            <span className="text-destructive font-medium">Sin stock</span>
          ) : product.stock < 10 ? (
            <span className="text-orange-600 font-medium">
              ¡Solo quedan {product.stock}!
            </span>
          ) : (
            <span className="text-green-600 font-medium">Disponible</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button 
          className="flex-1"
          variant="outline"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button 
          variant="destructive"
          size="icon"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>

    {/* Dialog de Edición */}
    <ProductEdit
      product={product}
      open={isEditDialogOpen}
      onOpenChange={setIsEditDialogOpen}
      onProductUpdated={onProductUpdated}
    />

    {/* Dialog de Confirmación de Eliminación */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">⚠️ ¿Eliminar producto permanentemente?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="font-semibold text-foreground">
              Esta acción es IRREVERSIBLE y eliminará:
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>El registro del producto de la base de datos</li>
              <li>La imagen asociada del servidor</li>
              <li>Toda la información relacionada</li>
            </ul>
            <div className="text-destructive font-medium">
              Producto: "<strong>{product.name}</strong>"
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
