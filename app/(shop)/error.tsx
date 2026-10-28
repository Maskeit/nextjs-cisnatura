"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Se muestra cuando una página de la tienda falla al renderizar, sobre todo si
// la API no responde. Conserva navbar y footer porque vive dentro de ShopLayout.
export default function ShopError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error en la tienda:", error)
  }, [error])

  return (
    <section className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center min-h-[60vh]">
      <h1 className="text-2xl md:text-3xl font-bold text-zinc-500">No pudimos cargar esta página</h1>
      <p className="text-muted-foreground max-w-md">
        Tuvimos un problema al conectar con la tienda. Intenta de nuevo en unos segundos.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </section>
  )
}
