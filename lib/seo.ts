// Fuente única de URLs y rutas para sitemap.xml, robots.txt y metadata SEO.
import { serverApi } from "@/lib/server-api"

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cisnaturatienda.com").replace(/\/$/, "")

// Páginas estáticas públicas que deben indexarse.
export const STATIC_PUBLIC_PATHS = ["/", "/protocolos"] as const

// Rutas que no deben aparecer en buscadores: sesión, compra, panel privado y
// flujos de autenticación. Debe coincidir con protectedRoutes/adminRoutes/authRoutes
// de proxy.ts más las páginas de verificación y recuperación de contraseña.
export const NON_INDEXABLE_PATHS = [
  "/admin",
  "/carrito",
  "/checkout",
  "/domicilio",
  "/perfil",
  "/login",
  "/register",
  "/verify-email",
  "/verify-email-reset",
  "/recover-password",
  "/reset-password",
] as const

const PAGE_SIZE = 100 // máximo que acepta el backend
// Tope de seguridad: 100 páginas x 100 = 10 000 productos. El límite de sitemap
// es 50 000 URLs, así que no se alcanza antes de revisar este número.
const MAX_PAGES = 100

export type PublishedProductRefs = {
  productSlugs: string[]
}

// Recorre el catálogo público (solo productos activos) y devuelve los slugs.
export async function fetchPublishedProductRefs(): Promise<PublishedProductRefs> {
  const first = await serverApi.productsPage(1, PAGE_SIZE)
  const lastPage = Math.min(first.pagination.total_pages, MAX_PAGES)
  const pages = [first]
  for (let page = 2; page <= lastPage; page++) {
    pages.push(await serverApi.productsPage(page, PAGE_SIZE))
  }

  const productSlugs = pages.flatMap(({ items }) => items.map((product) => product.slug))
  return { productSlugs }
}
