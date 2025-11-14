"use client"

import { Products } from "@/components/products/Products"

export default function Home() {

  return (
    <div className="flex flex-col min-h-screen">
      {/* Título de sección */}
      <div className="w-full py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Cisnatura / <span className="font-normal">Todos los productos</span>
        </h1>
      </div>

      {/* Productos */}
      <Products />
    </div>
  )
}