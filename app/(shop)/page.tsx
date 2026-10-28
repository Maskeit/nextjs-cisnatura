import type { Metadata } from "next"

import ProductFilters from "@/components/products/ProductFilters"
import { Products } from "@/components/products/Products"
import {
  CATALOG_PAGE_SIZE,
  RawSearchParams,
  buildCatalogHref,
  hasActiveFilters,
  parseCatalogFilters,
  toApiFilters,
} from "@/lib/catalog-filters"
import { serverApi } from "@/lib/server-api"

interface HomeProps {
  searchParams: Promise<RawSearchParams>
}

const TITLE = "Cisnatura - Productos Naturales"
const DESCRIPTION =
  "Tienda en línea de productos naturales, herbolaria y homeopatía. Compra y recibe en tu domicilio."

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  const filters = parseCatalogFilters(await searchParams)
  const filtered = hasActiveFilters(filters)

  // Búsquedas y filtros son combinaciones casi infinitas del mismo catálogo:
  // no se indexan y apuntan a la home. La paginación sí tiene URL canónica propia.
  const canonical = filtered ? "/" : buildCatalogHref({ page: filters.page })
  const title = filters.page > 1 && !filtered ? `${TITLE} - Página ${filters.page}` : TITLE

  return {
    title: { absolute: title },
    description: DESCRIPTION,
    alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description: DESCRIPTION,
      siteName: "Cisnatura",
      locale: "es_MX",
    },
    twitter: { card: "summary", title, description: DESCRIPTION },
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const filters = parseCatalogFilters(await searchParams)

  // Si la API de categorías falla, la página sigue funcionando sin ese filtro.
  // Si falla la de productos, el error lo atrapa app/(shop)/error.tsx.
  const [{ items, pagination }, categories] = await Promise.all([
    serverApi.productsPage(filters.page, CATALOG_PAGE_SIZE, toApiFilters(filters)),
    serverApi.categories().catch((error) => {
      console.error("home: no se pudieron cargar las categorías", error)
      return []
    }),
  ])

  return (
    <div className="flex flex-col min-h-screen px-3 md:px-6 pt-4 md:pt-8">
      {/* Título de sección */}
      <div className="w-full py-3 md:py-6">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-zinc-400">
          CISnatura /{" "}
          <span className="font-normal">
            {filters.q ? `Resultados para "${filters.q}"` : "Todos los productos"}
          </span>
        </h1>
      </div>

      <ProductFilters
        categories={categories}
        searchQuery={filters.q}
        selectedCategory={filters.category}
        selectedPriceRange={filters.price}
      />

      <Products products={items} pagination={pagination} filters={filters} />
    </div>
  )
}
