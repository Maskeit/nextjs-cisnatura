// Llamadas a la API desde Server Components y route handlers de metadata.
// Solo endpoints públicos: el servidor no tiene la sesión del navegador, así que
// no usa el cliente axios de lib/api.ts (que depende de cookies y del navegador).

import type {
  Category,
  CategoryListResponse,
  Pagination,
  Product,
  ProductResponse,
  ProductsResponse,
} from "@/interfaces/Products"

// Sin la barra final: .env define NEXT_PUBLIC_API_URL=http://localhost:8000/ y
// `${API_URL}/products/` quedaba como `//products/`, que FastAPI responde con 404.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "")

// Precio y stock cambian con las ventas y los descuentos: el detalle se refresca
// cada minuto. Los listados cambian menos, así que se refrescan cada 5 minutos.
// Las categorías casi no cambian.
export const REVALIDATE_PRODUCT_SECONDS = 60
export const REVALIDATE_LISTING_SECONDS = 300
export const REVALIDATE_CATEGORIES_SECONDS = 3600

export type ProductsPage = {
  items: Product[]
  pagination: Pagination
}

export type ProductsPageFilters = {
  category_id?: number
  search?: string
  min_price?: number
  max_price?: number
}

export class ServerApiError extends Error {
  status: number

  constructor(status: number, path: string) {
    super(`GET ${path} respondió ${status}`)
    this.name = "ServerApiError"
    this.status = status
  }
}

async function get<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } })
  if (!res.ok) throw new ServerApiError(res.status, path)
  return (await res.json()) as T
}

export const serverApi = {
  // Listado paginado de productos activos (el backend excluye los digitales,
  // que se venden como protocolos). `limit` máximo del backend: 100.
  productsPage: async (
    page = 1,
    limit = 20,
    filters: ProductsPageFilters = {},
  ): Promise<ProductsPage> => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filters.category_id !== undefined) query.set("category_id", String(filters.category_id))
    if (filters.search) query.set("search", filters.search.trim())
    if (filters.min_price !== undefined) query.set("min_price", String(filters.min_price))
    if (filters.max_price !== undefined) query.set("max_price", String(filters.max_price))

    const res = await get<ProductsResponse>(`/products/?${query}`, REVALIDATE_LISTING_SECONDS)
    return { items: res.data.products, pagination: res.data.pagination }
  },

  // Devuelve null si el producto no existe o está inactivo, para que la página
  // pueda llamar a notFound() sin capturar excepciones.
  productBySlug: async (slug: string): Promise<Product | null> => {
    try {
      const res = await get<ProductResponse>(
        `/products/slug/${encodeURIComponent(slug)}`,
        REVALIDATE_PRODUCT_SECONDS,
      )
      return res.data
    } catch (error) {
      if (error instanceof ServerApiError && error.status === 404) return null
      throw error
    }
  },

  // Categorías activas (el backend limita `limit` a 100).
  categories: async (): Promise<Category[]> => {
    const res = await get<CategoryListResponse>(
      "/products/categories?limit=100",
      REVALIDATE_CATEGORIES_SECONDS,
    )
    return res.data.categories
  },
}
