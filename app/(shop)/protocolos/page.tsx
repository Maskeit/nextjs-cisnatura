import { Suspense } from "react";
import ProtocolosClient from "@/app/(shop)/protocolos/ProtocolosClient";
import { Loader2 } from "lucide-react";

function ProtocolosFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ProtocolosPage() {

  return (
    <Suspense fallback={<ProtocolosFallback />}>
      <ProtocolosClient />
    </Suspense>
  );
}