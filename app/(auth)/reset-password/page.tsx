"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { ArrowLeft } from "lucide-react";
import { AuthAPI } from "@/lib/Auth";
import { toast } from "sonner";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState<string>("");
    const [isValidatingToken, setIsValidatingToken] = useState(true);

    useEffect(() => {
        if (!token) {
            toast.error("Token no encontrado");
            router.push("/recover-password");
            return;
        }

        // Validar token al cargar
        const validateToken = async () => {
            try {
                const response = await AuthAPI.verifyEmailRecover({ token });
                if (response.data?.email) {
                    setEmail(response.data.email);
                }
            } catch (err: any) {
                console.error("Error validando token:", err);
                let errorMessage = "Token inválido o expirado";
                
                if (err.response?.data?.detail?.message) {
                    errorMessage = err.response.data.detail.message;
                }
                
                toast.error(errorMessage);
                setTimeout(() => {
                    router.push("/recover-password");
                }, 2000);
            } finally {
                setIsValidatingToken(false);
            }
        };

        validateToken();
    }, [token, router]);

    const handleResetPassword = async (values: { new_password: string }) => {
        if (!token) {
            toast.error("Token no encontrado");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await AuthAPI.resetPassword({
                token: token,
                new_password: values.new_password
            });

            if (response.success) {
                toast.success("Contraseña actualizada correctamente", {
                    description: "Ya puedes iniciar sesión con tu nueva contraseña"
                });

                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                const errorMsg = response.message || "Error al actualizar contraseña";
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } catch (err: any) {
            console.error("Error al restablecer contraseña:", err);

            let errorMessage = "Error al actualizar la contraseña. Por favor intenta de nuevo.";

            if (err.response?.data?.detail) {
                const errorDetail = err.response.data.detail;
                if (errorDetail.message) {
                    errorMessage = errorDetail.message;
                } else if (typeof errorDetail === "string") {
                    errorMessage = errorDetail;
                }
            } else if (err.response?.status === 400) {
                errorMessage = "Token inválido o expirado. Solicita un nuevo enlace.";
            } else if (!err.response) {
                errorMessage = "Error de conexión. Verifica tu conexión a internet.";
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isValidatingToken) {
        return (
            <div className="bg-muted flex min-h-svh flex-col justify-center items-center p-6 md:p-10">
                <div className="bg-muted w-full max-w-sm md:max-w-4xl">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

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
                <ResetPasswordForm 
                    isLoading={isLoading} 
                    onSubmit={handleResetPassword} 
                    error={error}
                    email={email}
                />
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
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
            <ResetPasswordContent />
        </Suspense>
    );
}
