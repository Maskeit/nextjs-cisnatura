"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Protocols } from "@/components/protocolos/Protocols";

export default function ProtocolosClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen px-3 md:px-6 pt-4 md:pt-8">
      <div className="w-full py-3 md:py-6">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-zinc-400">
          CISnatura /{" "}
          <span className="font-normal">
            {searchQuery ? `Resultados para "${searchQuery}"` : "Protocolos"}
          </span>
        </h1>
      </div>
      <Protocols searchQuery={searchQuery} />
    </div>
  );
}
