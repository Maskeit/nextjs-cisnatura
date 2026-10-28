import type { Metadata } from "next"

import NotFoundContent from "@/components/NotFoundContent"

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
}

// notFound() lanzado desde las páginas de la tienda (p. ej. un producto
// inexistente): se muestra dentro de ShopLayout, con navbar y footer.
export default function ShopNotFound() {
  return <NotFoundContent />
}
