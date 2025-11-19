import { Suspense } from "react"
import HomeContent from "./HomeContent"
import { Filter } from "lucide-react"

function HomeFallback() {
  return (
    <div className="flex flex-col min-h-screen px-6 pt-8">
      {/* Título skeleton */}
      <div className="w-full py-6">
        <div className="h-8 w-96 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Barra de filtros skeleton */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtrar por:</span>
        </div>
        <div className="h-10 w-[200px] bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-[200px] bg-muted animate-pulse rounded-md" />
      </div>

      {/* Productos skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  )
}