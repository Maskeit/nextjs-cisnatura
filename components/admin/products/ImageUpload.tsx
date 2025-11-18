'use client';

import { useState, useCallback } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import ProductController from '@/lib/ProductController';
import Image from 'next/image';

interface ImageUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImageUrl?: string | null;
  onImageUploaded: (imageUrl: string) => void;
}

export const ImageUpload = ({
  open,
  onOpenChange,
  currentImageUrl,
  onImageUploaded,
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos JPG, PNG o WebP');
      return false;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('La imagen no debe superar los 5MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await ProductController.uploadProductImage(
        selectedFile,
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      );

      toast.success('Imagen subida correctamente');
      onImageUploaded(response.data.file_url);
      handleClose();
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      const errorMessage =
        error.response?.data?.message || 'Error al subir la imagen';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsDragging(false);
    onOpenChange(false);
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const displayImageUrl = currentImageUrl
    ? `${process.env.NEXT_PUBLIC_API_URL}${currentImageUrl}`
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Imagen del Producto</DialogTitle>
          <DialogDescription>
            Arrastra y suelta una imagen o haz clic para seleccionar. Máximo 5MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview de imagen actual */}
          {!previewUrl && displayImageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Imagen actual:</p>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                <Image
                  src={displayImageUrl}
                  alt="Imagen actual"
                  fill
                  className="object-cover"
                  unoptimized
                  key={currentImageUrl}
                />
              </div>
            </div>
          )}

          {/* Preview de nueva imagen */}
          {previewUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Nueva imagen:</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePreview}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}

          {/* Área de drag & drop */}
          {!previewUrl && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8
                transition-colors cursor-pointer
                ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
            >
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Arrastra y suelta tu imagen aquí
                  </p>
                  <p className="text-xs text-muted-foreground">
                    o haz clic para seleccionar
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG o WebP (máx. 5MB)
                </p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subiendo imagen...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir Imagen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
