"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import RecoverPasswordForm from "@/components/auth/RecoverPasswordForm";
import { ArrowLeft } from "lucide-react";
import { AuthAPI } from "@/lib/Auth";
import { toast } from "sonner";

function RecoverPasswordContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRecover = async (values: { email: string }) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await AuthAPI.recoverPassword({ email: values.email });
            
            if (response.success) {
                toast.success("Correo enviado", {
                    description: "Revisa tu correo electrónico para restablecer tu contraseña"
                });
                
                // Opcional: redirigir a una página de confirmación
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                const errorMsg = response.message || "Error al enviar el correo";
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } catch (err: any) {
            console.error("Error al recuperar contraseña:", err);

            let errorMessage = "Error al enviar el correo. Por favor intenta de nuevo.";

            if (err.response?.data?.detail) {
                const errorDetail = err.response.data.detail;
                if (errorDetail.message) {
                    errorMessage = errorDetail.message;
                } else if (typeof errorDetail === "string") {
                    errorMessage = errorDetail;
                }
            } else if (err.response?.status === 400) {
                errorMessage = "Este correo electrónico no está registrado";
            } else if (!err.response) {
                errorMessage = "Error de conexión. Verifica tu conexión a internet.";
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-muted flex min-h-svh flex-col justify-center items-center p-6 md:p-10">
            <div className="bg-muted w-full max-w-sm md:max-w-4xl">
                <div className="flex justify-center gap-2 md:justify-start mb-4">
                    <a 
                        href="/login" 
                        className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity"
                    >
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <ArrowLeft className="size-4" />
                        </div>
                        Volver a iniciar sesión
                    </a>
                </div>
                <RecoverPasswordForm 
                    isLoading={isLoading} 
                    onSubmit={handleRecover} 
                    error={error} 
                />
            </div>
        </div>
    );
}

export default function RecoverPasswordPage() {
    return (
        <Suspense fallback={
            <div className="bg-muted flex min-h-svh flex-col justify-center items-center p-6 md:p-10">
                <div className="bg-muted w-full max-w-sm md:max-w-4xl">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        }>
            <RecoverPasswordContent />
        </Suspense>
    );
}