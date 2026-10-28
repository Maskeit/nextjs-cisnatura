import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

// Contenido compartido del 404: lo usan app/not-found.tsx (URLs que no existen)
// y app/(shop)/not-found.tsx (notFound() dentro de la tienda, con navbar y footer).
export default function NotFoundContent() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center min-h-[60vh]">
      <Image src="/logocis.svg" alt="Cisnatura" width={180} height={60} className="h-14 w-auto" />
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">Error 404</p>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-500">Página no encontrada</h1>
        <p className="text-muted-foreground max-w-md">
          La página que buscas no existe o el producto ya no está disponible.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Ver todos los productos</Link>
      </Button>
    </section>
  )
}
