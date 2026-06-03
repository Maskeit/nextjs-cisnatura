"use client";

import { useState } from "react";
import Image from "next/image";
import { Protocol } from "@/interfaces/Protocol";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, BookOpen, Eye, EyeOff } from "lucide-react";
import { ProtocolEditDialog } from "./ProtocolEdit";
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
import { toast } from "sonner";
import ProtocolController from "@/lib/ProtocolController";

interface ProtocolCardProps {
  protocol: Protocol;
  onProtocolUpdated?: () => void;
}

export default function AdminProtocolCard({ protocol, onProtocolUpdated }: ProtocolCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedPrice = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(protocol.price);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const imageUrl = protocol.image_url
    ? `${apiBase}${protocol.image_url}`
    : "/placeholder.png";

  const hasImage = !!protocol.image_url;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await ProtocolController.adminDelete(protocol.id);
      toast.success("Protocolo eliminado");
      onProtocolUpdated?.();
      setIsDeleteOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al eliminar";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={`group overflow-hidden transition-all hover:shadow-lg ${!protocol.is_published ? "opacity-70" : ""}`}>
        {/* Imagen */}
        <div className="block relative aspect-square overflow-hidden">
          <Image
            src={imageUrl}
            alt={protocol.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized={hasImage}
            priority={false}
          />
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {protocol.is_published ? (
              <Badge className="text-[10px] bg-green-600 hover:bg-green-700">
                <Eye className="h-3 w-3 mr-1" /> Publicado
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                <EyeOff className="h-3 w-3 mr-1" /> Borrador
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{protocol.name}</h3>

          {protocol.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{protocol.description}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {protocol.phases.length} fases
            </span>
            {protocol.associated_product_ids?.length > 0 && (
              <span className="text-xs">
                · {protocol.associated_product_ids.length} producto{protocol.associated_product_ids.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Precio */}
          <span className="text-2xl font-bold text-primary">{formattedPrice}</span>
        </CardContent>

        <CardFooter className="pt-0 flex gap-2">
          <Button className="flex-1" variant="outline" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Edit dialog */}
      <ProtocolEditDialog
        protocol={protocol}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onProtocolUpdated={onProtocolUpdated}
      />

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ⚠️ ¿Eliminar protocolo?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Se eliminará <strong>&quot;{protocol.name}&quot;</strong> junto con todas sus fases y recursos.
                </p>
                <p className="text-destructive font-medium">Esta acción no se puede deshacer.</p>
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
              {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
