import { Suspense } from "react";
import VerifyEmailResetContent from "@/components/auth/VerifyEmailResetContent";
import { Loader2 } from "lucide-react";
import Image from "next/image";

function VerifyEmailResetFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-lg flex items-center justify-center">
                        <Image 
                            src="/logocis.svg" 
                            alt="CISnatura Logo" 
                            width={120} 
                            height={120}
                            priority
                        />
                    </div>
                </div>
                <div className="bg-background rounded-lg shadow-lg p-8 space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        <h2 className="text-2xl font-bold text-center">
                            Verificando...
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailResetPage() {
    return (
        <Suspense fallback={<VerifyEmailResetFallback />}>
            <VerifyEmailResetContent />
        </Suspense>
    );
}
