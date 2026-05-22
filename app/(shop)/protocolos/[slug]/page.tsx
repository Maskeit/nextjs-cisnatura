"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProtocolDetailed, ProtocolUserAccess, DifficultyLevel } from "@/interfaces/Protocol";
import ProtocolController from "@/lib/ProtocolController";
import CartController from "@/lib/CartController";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShoppingCart,
  ArrowLeft,
  Loader2,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Link as LinkIcon,
  Download,
  Play,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function ProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [protocol, setProtocol] = useState<ProtocolDetailed | null>(null);
  const [userAccess, setUserAccess] = useState<ProtocolUserAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [openPhase, setOpenPhase] = useState<number | null>(null);

  useEffect(() => {
    if (slug && !isAuthLoading) {
      fetchProtocol();
    }
  }, [slug, isAuthLoading, user]);

  const fetchProtocol = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Intentar cargar la versión completa (requiere acceso)
        try {
          const full = await ProtocolController.read(slug);
          setProtocol(full);
          // Buscar el acceso del usuario para obtener progreso
          const myProtocols = await ProtocolController.getMyProtocols();
          const access = myProtocols.find((p) => p.protocol_slug === slug) ?? null;
          setUserAccess(access);
          // Abrir primera fase por defecto si existe
          if (full.phases.length > 0) setOpenPhase(full.phases[0].id);
          return;
        } catch (err: any) {
          // 403 = no ha comprado, cargar versión pública
          if (err.response?.status !== 403) throw err;
        }
      }
      // Versión pública
      const pub = await ProtocolController.getBySlug(slug);
      setProtocol(pub);
    } catch (error) {
      toast.error("Protocolo no encontrado");
      router.push("/protocolos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!protocol) return;
    setIsAddingToCart(true);
    try {
      const response = await CartController.addItem({
        product_id: protocol.product_id,
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
        toast.info("Inicia sesión para comprar este protocolo", {
          action: { label: "Iniciar sesión", onClick: () => router.push("/login") },
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error al agregar al carrito");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handlePhaseComplete = async (phaseOrder: number) => {
    if (!protocol || !userAccess) return;
    const newCompleted = Math.max(
      userAccess.current_progress?.completed_phases ?? 0,
      phaseOrder + 1
    );
    try {
      await ProtocolController.updateProgress(slug, {
        current_phase_order: phaseOrder,
        completed_phases: newCompleted,
      });
      // Actualizar estado local
      setUserAccess((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          current_progress: prev.current_progress
            ? { ...prev.current_progress, completed_phases: newCompleted, current_phase_order: phaseOrder }
            : null,
        };
      });
      if (newCompleted >= protocol.total_phases) {
        toast.success("¡Felicidades! Completaste el protocolo 🎉");
      }
    } catch {
      toast.error("No se pudo guardar el progreso");
    }
  };

  // ——— Loading ———
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!protocol) return null;

  const hasAccess = !!userAccess;
  const progress = userAccess?.current_progress ?? null;
  const progressPercent = ProtocolController.getProgressPercent(
    progress?.completed_phases ?? 0,
    protocol.total_phases
  );
  const completed = ProtocolController.isCompleted(progress);

  const formattedPrice = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(protocol.price);

  const imageUrl = protocol.image_url
    ? `${process.env.NEXT_PUBLIC_API_URL}${protocol.image_url}`
    : "/placeholder.png";

  // ——— Iconos por tipo de recurso ———
  const resourceIcon: Record<string, React.ReactNode> = {
    image: <ImageIcon className="h-4 w-4" />,
    pdf: <FileText className="h-4 w-4" />,
    video: <Play className="h-4 w-4" />,
    link: <LinkIcon className="h-4 w-4" />,
    download: <Download className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-8 max-w-5xl mx-auto">
      {/* Volver */}
      <div className="mb-6">
        <Link href="/protocolos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Protocolos
          </Button>
        </Link>
      </div>

      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Imagen */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={protocol.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={!!protocol.image_url}
            priority
          />
          {hasAccess && completed && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-2 text-green-400" />
                <span className="font-semibold text-lg">Completado</span>
              </div>
            </div>
          )}
        </div>

        {/* Info principal */}
        <div className="flex flex-col space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {protocol.is_featured && <Badge>Destacado</Badge>}
            {protocol.difficulty_level && (
              <Badge variant={ProtocolController.getDifficultyColor(protocol.difficulty_level)}>
                {ProtocolController.getDifficultyLabel(protocol.difficulty_level)}
              </Badge>
            )}
            {hasAccess && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Acceso activo
              </Badge>
            )}
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-bold">{protocol.name}</h1>

          {/* Autor y versión */}
          {(protocol.author || protocol.version) && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {protocol.author && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" /> {protocol.author}
                </span>
              )}
              {protocol.version && <span>v{protocol.version}</span>}
            </div>
          )}

          {/* Descripción */}
          <p className="text-muted-foreground leading-relaxed">{protocol.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-y py-4">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {protocol.total_phases} {protocol.total_phases === 1 ? "fase" : "fases"}
            </span>
            {protocol.estimated_duration_hours && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {protocol.estimated_duration_hours}h estimadas
              </span>
            )}
          </div>

          {/* Precio o progreso */}
          {hasAccess ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tu progreso</span>
                <span className="font-medium">
                  {progress?.completed_phases ?? 0}/{protocol.total_phases} fases
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-4xl font-bold text-primary">{formattedPrice}</span>
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                disabled={isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="h-5 w-5 mr-2" />
                )}
                {isAddingToCart ? "Agregando..." : "Comprar protocolo"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Acceso inmediato tras confirmar el pago
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Descripción larga */}
      {protocol.long_description && (
        <div className="mb-10 prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mb-3">Acerca de este protocolo</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {protocol.long_description}
          </p>
        </div>
      )}

      {/* Fases */}
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold mb-4">
          {hasAccess ? "Contenido del protocolo" : "Lo que incluye"}
        </h2>

        {protocol.phases.map((phase, index) => {
          const isCompleted = (progress?.completed_phases ?? 0) > phase.order;
          const isOpen = openPhase === phase.id;

          return (
            <div
              key={phase.id}
              className="border rounded-xl overflow-hidden"
            >
              {/* Cabecera de fase */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => {
                  if (hasAccess) setOpenPhase(isOpen ? null : phase.id);
                }}
                disabled={!hasAccess}
              >
                {/* Número / check */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : hasAccess
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{phase.title}</p>
                  {phase.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {phase.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-muted-foreground">
                  {phase.duration_minutes && (
                    <span className="hidden sm:flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {phase.duration_minutes} min
                    </span>
                  )}
                  {!hasAccess ? (
                    <Lock className="h-4 w-4" />
                  ) : isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Contenido de fase (solo con acceso) */}
              {hasAccess && isOpen && (
                <div className="border-t px-5 py-6 space-y-6">
                  {/* HTML del contenido */}
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none text-sm md:text-base"
                    dangerouslySetInnerHTML={{ __html: phase.content }}
                  />

                  {/* Recursos */}
                  {phase.resources.filter((r) => r.is_visible).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Recursos
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {phase.resources
                          .filter((r) => r.is_visible)
                          .map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                            >
                              <span className="text-primary">
                                {resourceIcon[resource.resource_type] ?? <FileText className="h-4 w-4" />}
                              </span>
                              <span className="flex-1 truncate font-medium">{resource.title}</span>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Botón marcar fase como completada */}
                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={() => handlePhaseComplete(phase.order)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como completada
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA inferior — solo si no tiene acceso */}
      {!hasAccess && (
        <div className="mt-12 border rounded-xl p-8 text-center space-y-4 bg-muted/30">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="text-xl font-semibold">Desbloquea el contenido completo</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Compra este protocolo para acceder a todas las fases, recursos y poder
            registrar tu progreso.
          </p>
          <span className="block text-3xl font-bold text-primary">{formattedPrice}</span>
          <Button
            size="lg"
            className="h-14 px-12 text-lg"
            disabled={isAddingToCart}
            onClick={handleAddToCart}
          >
            {isAddingToCart ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="h-5 w-5 mr-2" />
            )}
            {isAddingToCart ? "Agregando..." : "Comprar ahora"}
          </Button>
        </div>
      )}
    </div>
  );
}
