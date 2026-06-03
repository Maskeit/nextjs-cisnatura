"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProtocolDetailed, ProtocolUserAccess } from "@/interfaces/Protocol";
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
  Package,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [protocol, setProtocol] = useState<ProtocolDetailed | null>(null);
  const [userAccess, setUserAccess] = useState<ProtocolUserAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set());
  const [completedOrders, setCompletedOrders] = useState<Set<number>>(new Set());
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  useEffect(() => {
    if (slug && !isAuthLoading) {
      fetchProtocol();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAuthLoading, user]);

  // Restaurar progreso desde el servidor
  useEffect(() => {
    if (!userAccess?.current_progress || !protocol) return;
    const prog = userAccess.current_progress;
    if (prog.completed_phases > 0) {
      const initial = new Set<number>();
      protocol.phases
        .slice(0, prog.completed_phases)
        .forEach((p) => initial.add(p.order));
      setCompletedOrders(initial);
    }
  }, [userAccess, protocol]);

  const fetchProtocol = async () => {
    setIsLoading(true);
    try {
      if (user) {
        try {
          const full = await ProtocolController.read(slug);
          setProtocol(full);
          const myProtocols = await ProtocolController.getMyProtocols();
          const access = myProtocols.find((p) => p.protocol_slug === slug) ?? null;
          setUserAccess(access);
          if (full.phases.length > 0) {
            setOpenPhases(new Set([full.phases[0].id]));
          }
          return;
        } catch (err: any) {
          if (err.response?.status !== 403) throw err;
        }
      }
      const pub = await ProtocolController.getBySlug(slug);
      setProtocol(pub);
    } catch {
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
        item_type: "protocol",
        protocol_id: protocol.id,
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
      } else {
        toast.error(error.response?.data?.message ?? "Error al agregar al carrito");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const togglePhase = (phaseId: number) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      next.has(phaseId) ? next.delete(phaseId) : next.add(phaseId);
      return next;
    });
  };

  const togglePhaseComplete = async (phaseOrder: number) => {
    if (!userAccess) return;
    const newSet = new Set(completedOrders);
    newSet.has(phaseOrder) ? newSet.delete(phaseOrder) : newSet.add(phaseOrder);
    const prev = completedOrders;
    setCompletedOrders(newSet);

    const completedCount = newSet.size;
    const maxOrder = newSet.size > 0 ? Math.max(...Array.from(newSet)) : 0;

    try {
      setIsSavingProgress(true);
      await ProtocolController.updateProgress(slug, {
        current_phase_order: maxOrder,
        completed_phases: completedCount,
      });
      if (completedCount >= (protocol?.total_phases ?? 0) && completedCount > 0) {
        toast.success("¡Completaste el protocolo!");
      }
    } catch {
      setCompletedOrders(prev);
      toast.error("No se pudo guardar el progreso");
    } finally {
      setIsSavingProgress(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!protocol) return null;

  const hasAccess = !!userAccess;
  const isFree = protocol.price === 0;
  const canAccess = hasAccess || isFree;
  const progressPercent = ProtocolController.getProgressPercent(
    completedOrders.size,
    protocol.total_phases
  );
  const allDone =
    hasAccess &&
    protocol.total_phases > 0 &&
    completedOrders.size >= protocol.total_phases;

  const formattedPrice = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(protocol.price);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const imageUrl = protocol.image_url
    ? `${apiBase}${protocol.image_url}`
    : "/placeholder.png";

  const resourceIcon: Record<string, React.ReactNode> = {
    image: <ImageIcon className="h-4 w-4" />,
    pdf: <FileText className="h-4 w-4" />,
    video: <Play className="h-4 w-4" />,
    link: <LinkIcon className="h-4 w-4" />,
    download: <Download className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
        <Link href="/protocolos">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a protocolos
          </Button>
        </Link>
      </div>

      {/* ─── CABECERA / HERO ──────────────────────────────── */}
      <header className="max-w-5xl mx-auto px-4 md:px-6 mt-8 mb-10">
        {/* Categoría + badges */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {protocol.category && (
            <Badge variant="secondary" className="text-xs uppercase tracking-widest font-medium">
              {protocol.category.name}
            </Badge>
          )}
          {protocol.is_featured && (
            <Badge className="gap-1 text-xs">
              <Sparkles className="h-3 w-3" /> Destacado
            </Badge>
          )}
          {isFree && (
            <Badge variant="outline" className="text-green-600 border-green-600 text-xs font-semibold">
              Acceso gratuito
            </Badge>
          )}
          {hasAccess && (
            <Badge
              variant="outline"
              className="text-green-700 border-green-600 text-xs gap-1"
            >
              <CheckCircle2 className="h-3 w-3" /> Acceso activo
            </Badge>
          )}
        </div>

        {/* Título principal */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4">
          {protocol.name}
        </h1>

        {/* Autor / versión */}
        {(protocol.author || protocol.version) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
            {protocol.author && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {protocol.author}
              </span>
            )}
            {protocol.version && (
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                v{protocol.version}
              </span>
            )}
          </div>
        )}

        {/* Descripción breve — estilo lead de revista */}
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed border-l-4 border-primary/40 pl-5 italic">
          {protocol.description}
        </p>

        {/* Meta: fases y duración */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 mt-6 pt-5 border-t text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary/70" />
            {protocol.total_phases}{" "}
            {protocol.total_phases === 1 ? "fase" : "fases"}
          </span>
          {protocol.estimated_duration_hours && (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/70" />
              {protocol.estimated_duration_hours}h estimadas
            </span>
          )}
        </div>
      </header>

      {/* ─── IMAGEN + TARJETA CTA/PROGRESO ───────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mb-14">
        <div className={cn("grid gap-8", imageUrl ? "md:grid-cols-5" : "")}>
          {/* Imagen */}
          {imageUrl && (
            <div className="md:col-span-3 relative aspect-video rounded-2xl overflow-hidden bg-muted shadow-lg">
              <Image
                src={imageUrl}
                alt={protocol.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
                unoptimized
                priority
              />
              {allDone && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <CheckCircle2 className="h-14 w-14 mx-auto mb-2 text-green-400" />
                    <p className="font-semibold text-lg">Protocolo completado</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tarjeta lateral */}
          <div
            className={cn(
              "flex flex-col justify-center",
              imageUrl ? "md:col-span-2" : "max-w-sm"
            )}
          >
            {hasAccess ? (
              /* ── Progreso ── */
              <div className="rounded-2xl border p-6 space-y-4 bg-card shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Tu progreso
                </p>
                <Progress value={progressPercent} className="h-3 rounded-full" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedOrders.size} de {protocol.total_phases} fases
                  </span>
                  <span className="font-bold text-primary text-base">
                    {progressPercent}%
                  </span>
                </div>
                {isSavingProgress && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Guardando progreso…
                  </p>
                )}
                {allDone && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium pt-1">
                    <CheckCircle2 className="h-4 w-4" />
                    ¡Protocolo completado!
                  </div>
                )}
              </div>
            ) : isFree ? (
              /* ── Gratis ── */
              <div className="rounded-2xl border p-6 space-y-3 bg-card shadow-sm text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-semibold text-base">Acceso gratuito</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Todo el contenido de este protocolo está disponible sin costo.
                </p>
              </div>
            ) : (
              /* ── Comprar ── */
              <div className="rounded-2xl border p-6 space-y-5 bg-card shadow-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Precio
                  </p>
                  <span className="text-4xl font-bold text-primary">
                    {formattedPrice}
                  </span>
                </div>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Acceso inmediato tras confirmar pago
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {protocol.total_phases} fases con contenido completo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Registro de progreso personal
                  </li>
                </ul>
                <Button
                  size="lg"
                  className="w-full h-12 text-base"
                  disabled={isAddingToCart}
                  onClick={handleAddToCart}
                >
                  {isAddingToCart ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 mr-2" />
                  )}
                  {isAddingToCart ? "Agregando…" : "Agregar al carrito"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── CUERPO DEL ARTÍCULO ──────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 pb-24 space-y-14">

        {/* Descripción larga */}
        {protocol.long_description && (
          <section>
            <h2 className="text-2xl font-bold mb-6 pb-3 border-b">
              Acerca de este protocolo
            </h2>
            <div
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-p:leading-[1.85] prose-p:text-base md:prose-p:text-lg
                prose-headings:font-bold prose-headings:tracking-tight
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:font-semibold prose-li:leading-[1.7]"
            >
              <p className="whitespace-pre-line">{protocol.long_description}</p>
            </div>
          </section>
        )}

        {/* Productos del protocolo */}
        {protocol.associated_products?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-3 pb-3 border-b">
              Productos del protocolo
            </h2>
            <p className="text-muted-foreground text-base mb-6 leading-relaxed">
              Para llevar a cabo este protocolo necesitarás los siguientes productos:
            </p>
            <div className="flex flex-wrap gap-3">
              {protocol.associated_products.map((product) => (
                <Link
                  key={product.id}
                  href={`/productos/${product.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border bg-muted/40 hover:bg-muted hover:border-primary/40 transition-colors text-sm font-medium"
                >
                  <Package className="h-4 w-4 text-primary flex-shrink-0" />
                  {product.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── FASES ─────────────────────────────────────── */}
        <section>
          <div className="flex items-start justify-between gap-4 mb-3 pb-3 border-b">
            <h2 className="text-2xl font-bold">
              {canAccess ? "Fases del protocolo" : "Contenido incluido"}
            </h2>
            {hasAccess && (
              <span className="text-xs text-muted-foreground text-right leading-relaxed pt-1 max-w-[200px]">
                Marca cada fase al completarla. El progreso se guarda automáticamente.
              </span>
            )}
          </div>

          <div className="space-y-3 mt-6">
            {protocol.phases.map((phase, index) => {
              const isDone = completedOrders.has(phase.order);
              const isOpen = openPhases.has(phase.id);

              return (
                <article
                  key={phase.id}
                  className={cn(
                    "border rounded-xl overflow-hidden transition-colors duration-200",
                    isDone && hasAccess
                      ? "border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/10"
                      : "bg-card"
                  )}
                >
                  {/* Cabecera de fase */}
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Checkbox personalizado */}
                    <div className="flex-shrink-0 mt-0.5">
                      {hasAccess ? (
                        <button
                          onClick={() => togglePhaseComplete(phase.order)}
                          disabled={isSavingProgress}
                          aria-label={isDone ? "Marcar como pendiente" : "Marcar como completada"}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                            isDone
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-muted-foreground/40 hover:border-green-500",
                            isSavingProgress && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>
                      ) : (
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            canAccess
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </div>
                      )}
                    </div>

                    {/* Número + texto (cuando hay acceso, el número aparece en el texto) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p
                            className={cn(
                              "font-semibold text-base leading-snug",
                              isDone && hasAccess
                                ? "line-through text-muted-foreground"
                                : ""
                            )}
                          >
                            {hasAccess ? (
                              <span className="text-muted-foreground font-normal mr-1.5 text-sm">
                                {index + 1}.
                              </span>
                            ) : null}
                            {phase.title}
                          </p>
                          {phase.description && (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {phase.description}
                            </p>
                          )}
                        </div>

                        {/* Meta + toggle */}
                        <div className="flex items-center gap-2 flex-shrink-0 text-muted-foreground">
                          {phase.duration_minutes && (
                            <span className="hidden sm:flex items-center gap-1 text-xs">
                              <Clock className="h-3.5 w-3.5" />
                              {phase.duration_minutes} min
                            </span>
                          )}
                          {!canAccess ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <button
                              onClick={() => togglePhase(phase.id)}
                              className="p-1 hover:text-foreground transition-colors rounded"
                            >
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {canAccess && isOpen && (
                    <div className="border-t bg-background/70 px-5 md:px-8 py-8 space-y-8">
                      {/* HTML del contenido — estilo artículo */}
                      <div
                        className="prose prose-neutral dark:prose-invert max-w-none
                          prose-headings:font-bold prose-headings:tracking-tight prose-headings:mt-8 prose-headings:mb-3
                          prose-h2:text-xl prose-h3:text-lg
                          prose-p:leading-[1.85] prose-p:text-base prose-p:my-4
                          prose-li:leading-[1.7] prose-li:my-1
                          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                          prose-strong:font-semibold prose-strong:text-foreground
                          prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-blockquote:italic
                          prose-img:rounded-xl prose-img:shadow-md prose-img:my-6
                          prose-hr:border-border
                          prose-table:text-sm prose-thead:bg-muted/50
                          [&>*:first-child]:mt-0"
                        dangerouslySetInnerHTML={{ __html: phase.content }}
                      />

                      {/* Recursos */}
                      {phase.resources?.filter((r) => r.is_visible).length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                            Recursos de esta fase
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
                                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group"
                                >
                                  <span className="text-primary group-hover:scale-110 transition-transform">
                                    {resourceIcon[resource.resource_type] ?? (
                                      <FileText className="h-4 w-4" />
                                    )}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {resource.title}
                                    </p>
                                    {resource.description && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {resource.description}
                                      </p>
                                    )}
                                  </div>
                                </a>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* ─── CTA INFERIOR (no tiene acceso y no es gratis) ── */}
        {!canAccess && (
          <section className="border rounded-2xl p-8 md:p-12 text-center space-y-5 bg-muted/20">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">
                Desbloquea el contenido completo
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Adquiere este protocolo para acceder a las{" "}
                {protocol.total_phases} fases completas, recursos adjuntos y tu
                registro de progreso personal.
              </p>
            </div>
            <span className="block text-4xl font-bold text-primary">
              {formattedPrice}
            </span>
            <Button
              size="lg"
              className="h-12 px-10 text-base"
              disabled={isAddingToCart}
              onClick={handleAddToCart}
            >
              {isAddingToCart ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-5 w-5 mr-2" />
              )}
              {isAddingToCart ? "Agregando…" : "Comprar protocolo"}
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}
