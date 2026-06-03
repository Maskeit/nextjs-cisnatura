"use client";
import { Protocols } from "@/components/protocolos/Protocols";
import { useSearchParams } from "next/dist/client/components/navigation";
import { useState, useEffect } from "react";

export default function ProtocolosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Evitar hidratación mismatch
  useEffect(() => {
    setMounted(true);
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen px-3 md:px-6 pt-4 md:pt-8">
      {/* Título de sección */}
      <div className="w-full py-3 md:py-6">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-zinc-400">
          CISnatura /{" "}
          <span className="font-normal">
            {searchQuery
              ? `Resultados para "${searchQuery}"`
              : "Protocolos"}
          </span>
        </h1>
      </div>
      <Protocols />
    </div>
  );
}
