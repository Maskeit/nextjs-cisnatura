"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtocolListItem } from "@/interfaces/Protocol";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2, BookOpen, Clock, BookOpenCheck } from "lucide-react";
import CartController from "@/lib/CartController";
import { toast } from "sonner";

interface ProtocolCardProps {
  protocolo: ProtocolListItem;
  isOwned?: boolean;
}

export const ProtocolCard = ({ protocolo, isOwned = false }: ProtocolCardProps) => {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const formattedPrice = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(protocolo.price);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const imageUrl = protocolo.image_url
    ? `${apiBase}${protocolo.image_url}`
    : "/placeholder.png";

  const hasImage = !!protocolo.image_url;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const response = await CartController.addItem({
        product_id: protocolo.product_id ?? protocolo.id,
        quantity: 1,
      });
      if (response.success) {
        toast.success("Protocolo agregado al carrito");
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (error: any) {
      if (
        error.response?.status === 401 ||
        error.response?.data?.error === "AUTHENTICATION_REQUIRED"
      ) {
        toast.info("Inicia sesión para agregar productos a tu carrito", {
          action: {
            label: "Iniciar sesión",
            onClick: () => router.push("/login"),
          },
        });
        setTimeout(() => router.push("/login"), 2000);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error al agregar el protocolo al carrito");
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
      {/* Imagen */}
      <Link
        href={`/protocolos/${protocolo.slug}`}
        className="block relative aspect-square overflow-hidden"
      >
        <Image
          src={imageUrl}
          alt={protocolo.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 45vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized={hasImage}
          priority={false}
        />
        {protocolo.is_featured && (
          <div className="absolute top-1 left-1 md:top-2 md:left-2">
            <Badge className="text-[10px] md:text-xs px-1.5 py-0.5">
              Destacado
            </Badge>
          </div>
        )}
      </Link>

      <CardContent className="pt-2 md:pt-4 px-2 md:px-6 flex-1 flex flex-col">
        {/* Nombre */}
        <Link href={`/protocolos/${protocolo.slug}`}>
          <h3 className="font-semibold text-xs md:text-lg line-clamp-2 hover:text-primary transition-colors mb-1 md:mb-2">
            {protocolo.name}
          </h3>
        </Link>

        {/* Descripción — solo desktop */}
        {protocolo.description && (
          <p className="hidden md:block text-sm text-muted-foreground line-clamp-2 mb-3">
            {protocolo.description}
          </p>
        )}

        {/* Meta: fases y duración */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {protocolo.total_phases} {protocolo.total_phases === 1 ? "fase" : "fases"}
          </span>
          {protocolo.estimated_duration_hours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {protocolo.estimated_duration_hours}h
            </span>
          )}
        </div>

        {/* Precio */}
        <div className="mt-auto">
          <span className="text-sm md:text-2xl font-bold text-primary">
            {formattedPrice}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-2 md:px-6 pb-2 md:pb-6">
        {isOwned || protocolo.price === 0 ? (
          <Button className="w-full h-8 md:h-10 text-xs md:text-sm" variant="secondary" asChild>
            <Link href={`/protocolos/${protocolo.slug}`}>
              <BookOpenCheck className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Acceder al protocolo</span>
              <span className="sm:hidden">Acceder</span>
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full h-8 md:h-10 text-xs md:text-sm"
            disabled={isAdding || !protocolo.product_id}
            onClick={handleAddToCart}
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            )}
            <span className="hidden sm:inline">
              {isAdding ? "Agregando..." : protocolo.product_id ? "Agregar al carrito" : "No disponible"}
            </span>
            <span className="sm:hidden">
              {isAdding ? "..." : protocolo.product_id ? "Agregar" : "—"}
            </span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
