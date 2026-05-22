"use client";

import { useState, useCallback } from "react";
import { Upload, X, ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import ProtocolController from "@/lib/ProtocolController";
import Image from "next/image";

interface FileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFileUrl?: string | null;
  onFileUploaded: (fileUrl: string) => void;
  /** "image" solo acepta imágenes, "any" acepta imágenes + PDFs */
  accept?: "image" | "any";
}

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const PDF_TYPES = ["application/pdf"];
const IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";
const ANY_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,application/pdf";

export const FileUpload = ({
  open,
  onOpenChange,
  currentFileUrl,
  onFileUploaded,
  accept = "image",
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  const allowedTypes = accept === "any" ? [...IMAGE_TYPES, ...PDF_TYPES] : IMAGE_TYPES;
  const maxSize = accept === "any" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  const acceptAttr = accept === "any" ? ANY_ACCEPT : IMAGE_ACCEPT;
  const description =
    accept === "any"
      ? "Arrastra y suelta un archivo aquí. Imágenes (máx 5MB) o PDFs (máx 10MB)."
      : "Arrastra y suelta una imagen aquí. Máximo 5MB.";

  const validateFile = (file: File): boolean => {
    if (!allowedTypes.includes(file.type)) {
      const allowed = accept === "any" ? "JPG, PNG, WebP o PDF" : "JPG, PNG o WebP";
      toast.error(`Solo se permiten archivos ${allowed}`);
      return false;
    }
    if (file.size > maxSize) {
      toast.error(`El archivo no debe superar los ${maxSize / (1024 * 1024)}MB`);
      return false;
    }
    return true;
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;
      setSelectedFile(file);
      const pdf = PDF_TYPES.includes(file.type);
      setIsPdf(pdf);
      if (!pdf) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    },
    [accept]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecciona un archivo");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const response = await ProtocolController.uploadFile(selectedFile, (ev) => {
        const progress = Math.round((ev.loaded * 100) / ev.total);
        setUploadProgress(progress);
      });
      toast.success("Archivo subido correctamente");
      onFileUploaded(response.data.file_url);
      handleClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al subir el archivo";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsPdf(false);
    setUploadProgress(0);
    setIsDragging(false);
    onOpenChange(false);
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsPdf(false);
  };

  const displayImageUrl =
    currentFileUrl && !currentFileUrl.endsWith(".pdf")
      ? `${process.env.NEXT_PUBLIC_API_URL}${currentFileUrl}`
      : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {accept === "any" ? "Subir Archivo" : "Subir Imagen"}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current image preview */}
          {!selectedFile && displayImageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Archivo actual:</p>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                <Image src={displayImageUrl} alt="Actual" fill className="object-cover" unoptimized />
              </div>
            </div>
          )}

          {/* Current PDF indicator */}
          {!selectedFile && currentFileUrl?.endsWith(".pdf") && (
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <FileText className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium">PDF actual</p>
                <p className="text-xs text-muted-foreground truncate max-w-[250px]">{currentFileUrl}</p>
              </div>
            </div>
          )}

          {/* New image preview */}
          {previewUrl && !isPdf && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Nueva imagen:</p>
                <Button variant="ghost" size="sm" onClick={handleRemovePreview} disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              </div>
            </div>
          )}

          {/* New PDF preview */}
          {selectedFile && isPdf && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Archivo seleccionado:</p>
                <Button variant="ghost" size="sm" onClick={handleRemovePreview} disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                <FileText className="h-10 w-10 text-red-500" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[250px]">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Drop zone */}
          {!selectedFile && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                accept={acceptAttr}
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-4 rounded-full bg-primary/10">
                  {accept === "any" ? (
                    <Upload className="h-8 w-8 text-primary" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-primary" />
                  )}
                </div>
                <p className="text-sm font-medium">Arrastra y suelta aquí</p>
                <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground">
                  {accept === "any" ? "JPG, PNG, WebP o PDF" : "JPG, PNG o WebP"}
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subiendo...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" /> Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Subir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
