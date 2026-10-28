import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddToCartButton from '@/components/products/AddToCartButton';
import { SITE_URL } from '@/lib/seo';
import { serverApi } from '@/lib/server-api';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const formatMXN = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

// Una sola línea y máximo ~160 caracteres, que es lo que muestran los buscadores.
function toMetaDescription(text: string | null, fallback: string): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}...` : clean;
}

// generateMetadata y la página piden el mismo producto: fetch deduplica la
// llamada dentro de la misma petición.
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await serverApi.productBySlug(slug);

  if (!product) {
    return { title: 'Producto no encontrado', robots: { index: false } };
  }

  const url = `${SITE_URL}/productos/${encodeURIComponent(product.slug)}`;
  const description = toMetaDescription(
    product.description,
    `Compra ${product.name} en Cisnatura, tienda de productos naturales.`,
  );
  const images = product.image_url ? [`${apiBase}${product.image_url}`] : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: product.name,
      description,
      siteName: 'Cisnatura',
      locale: 'es_MX',
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: product.name,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await serverApi.productBySlug(slug);

  if (!product) notFound();

  const isOutOfStock = product.stock === 0;
  const hasImage = !!product.image_url;
  const imageUrl = hasImage ? `${apiBase}${product.image_url}` : '/placeholder.png';
  const url = `${SITE_URL}/productos/${encodeURIComponent(product.slug)}`;

  // Datos estructurados para resultados enriquecidos (precio y disponibilidad).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    sku: product.slug,
    image: hasImage ? [imageUrl] : undefined,
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MXN',
      price: product.price,
      availability: isOutOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };

  return (
    <div className="min-h-screen px-6 py-8">
      {/* '<' escapado para que el contenido del producto no pueda cerrar el script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

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
                    {formatMXN(product.price)}
                  </span>
                  <span className="text-3xl text-muted-foreground line-through">
                    {formatMXN(product.discount.original_price)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                    🎉 {product.discount.discount_name}
                  </span>
                  <span className="text-base text-muted-foreground">
                    (Ahorras {formatMXN(product.discount.savings)})
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-primary">
                  {formatMXN(product.price)}
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
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description || 'No hay descripción disponible para este producto.'}
            </p>
          </div>

          {/* Cantidad y botón de carrito (interactivo, solo esta parte hidrata) */}
          <AddToCartButton productId={product.id} stock={product.stock} />

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
