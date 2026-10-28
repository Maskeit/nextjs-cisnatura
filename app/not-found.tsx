import type { Metadata } from "next"

import NotFoundContent from "@/components/NotFoundContent"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
}

// 404 global: se renderiza solo dentro del layout raíz (sin navbar ni footer),
// por eso incluye su propio ThemeProvider para respetar el modo oscuro.
export default function NotFound() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <main className="flex min-h-screen items-center justify-center">
        <NotFoundContent />
      </main>
    </ThemeProvider>
  )
}
