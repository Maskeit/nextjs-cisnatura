import type { MetadataRoute } from "next"

import { SITE_URL, STATIC_PUBLIC_PATHS, fetchPublishedProductRefs } from "@/lib/seo"

// Regenera cada hora: el sitemap sigue al catálogo sin requerir un rebuild.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }))

  try {
    const { productSlugs } = await fetchPublishedProductRefs()
    return [
      ...staticEntries,
      ...productSlugs.map((slug) => ({
        url: `${SITE_URL}/productos/${encodeURIComponent(slug)}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ]
  } catch (error) {
    // Si la API no responde (p. ej. durante el build), se publican al menos las
    // páginas estáticas en vez de romper la generación del sitemap.
    console.error("sitemap: no se pudieron cargar los productos activos", error)
    return staticEntries
  }
}
