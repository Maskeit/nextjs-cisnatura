import type { MetadataRoute } from "next"

import { NON_INDEXABLE_PATHS, SITE_URL } from "@/lib/seo"

// Crawlers que se permiten explícitamente. Es la misma lista que ya declaraba
// public/robots.txt (incluye bots de IA). Cada grupo repite las rutas bloqueadas:
// permitir el crawler no significa exponer el panel privado.
const EXPLICIT_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "CCBot",
  "anthropic-ai",
  "Claude-Web",
]

export default function robots(): MetadataRoute.Robots {
  const disallow = [...NON_INDEXABLE_PATHS]

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...EXPLICIT_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
