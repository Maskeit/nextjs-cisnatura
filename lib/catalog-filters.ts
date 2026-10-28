// Filtros del catálogo de la home. La URL es la única fuente de verdad: el
// servidor los lee de searchParams y el cliente los escribe con router/Link.
// Sin JSX ni dependencias de runtime, para poder usarse en ambos lados.

import type { ProductsPageFilters } from "@/lib/server-api"

export type PriceRangeId = "all" | "0-100" | "100-300" | "300-500" | "500+"

export type PriceRange = {
  id: PriceRangeId
  label: string
  min?: number
  max?: number
}

export const PRICE_RANGES: PriceRange[] = [
  { id: "all", label: "Todos los precios" },
  { id: "0-100", label: "Menos de $100", min: 0, max: 100 },
  { id: "100-300", label: "$100 - $300", min: 100, max: 300 },
  { id: "300-500", label: "$300 - $500", min: 300, max: 500 },
  { id: "500+", label: "Más de $500", min: 500 },
]

export const CATALOG_PAGE_SIZE = 20

// Topes para que una URL arbitraria no genere llamadas absurdas a la API.
const MAX_QUERY_LENGTH = 100
const MAX_PAGE = 1000

export type CatalogFilters = {
  q: string
  category?: number
  price: PriceRangeId
  page: number
}

export type RawSearchParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const toPositiveInt = (value: string | undefined) => {
  if (!value || !/^\d+$/.test(value)) return undefined
  const n = Number(value)
  return n > 0 ? n : undefined
}

// Valores inválidos o desconocidos se ignoran en vez de fallar: la home siempre debe renderizar.
export function parseCatalogFilters(params: RawSearchParams): CatalogFilters {
  const price = first(params.precio)
  return {
    q: (first(params.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    category: toPositiveInt(first(params.categoria)),
    price: PRICE_RANGES.some((range) => range.id === price) ? (price as PriceRangeId) : "all",
    page: Math.min(toPositiveInt(first(params.page)) ?? 1, MAX_PAGE),
  }
}

// Construye la URL de la home omitiendo los valores por defecto.
export function buildCatalogHref(filters: Partial<CatalogFilters>): string {
  const query = new URLSearchParams()
  if (filters.q) query.set("q", filters.q)
  if (filters.category !== undefined) query.set("categoria", String(filters.category))
  if (filters.price && filters.price !== "all") query.set("precio", filters.price)
  if (filters.page && filters.page > 1) query.set("page", String(filters.page))
  const qs = query.toString()
  return qs ? `/?${qs}` : "/"
}

// Traduce los filtros de la URL a los parámetros de GET /products/.
export function toApiFilters(filters: CatalogFilters): ProductsPageFilters {
  const range = PRICE_RANGES.find((r) => r.id === filters.price)
  return {
    category_id: filters.category,
    search: filters.q || undefined,
    min_price: range?.min,
    max_price: range?.max,
  }
}

// ¿Hay búsqueda o filtros activos? (la paginación sola no cuenta)
export const hasActiveFilters = (filters: CatalogFilters) =>
  filters.q !== "" || filters.category !== undefined || filters.price !== "all"
