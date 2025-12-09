"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthAPI } from "@/lib/Auth";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function VerifyEmailResetContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (token) {
            verifyResetToken(token);
        } else {
            setStatus("error");
            setMessage("Token de verificación no proporcionado");
        }
    }, [token]);

    const verifyResetToken = async (verificationToken: string) => {
        try {
            const response = await AuthAPI.verifyEmailRecover({ token: verificationToken });
            
            if (response && response.data?.email) {
                setStatus("success");
                setMessage("Token válido. Redirigiendo al formulario de reseteo...");
                setEmail(response.data.email);
                
                toast.success("Token verificado correctamente", {
                    description: "Serás redirigido al formulario de cambio de contraseña",
                });
                
                // Redirigir a la página de reset password con el token
                setTimeout(() => {
                    router.push(`/reset-password?token=${verificationToken}`);
                }, 2000);
            }
        } catch (err: any) {
            console.error("Error al verificar token:", err);
            
            let errorMessage = "Error al verificar el token";
            
            if (err.response?.data?.detail) {
                const errorDetail = err.response.data.detail;
                if (errorDetail.message) {
                    errorMessage = errorDetail.message;
                } else if (typeof errorDetail === "string") {
                    errorMessage = errorDetail;
                }
            } else if (err.response?.status === 400) {
                errorMessage = "Token de verificación inválido o expirado";
            } else if (!err.response) {
                errorMessage = "Error de conexión. Verifica tu conexión a internet.";
            }
            
            setStatus("error");
            setMessage(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleRequestNewToken = () => {
        router.push("/recover-password");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
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

                {/* Content */}
                <div className="bg-background rounded-lg shadow-lg p-8 space-y-6">
                    {status === "loading" && (
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            <h2 className="text-2xl font-bold text-center">
                                Verificando token
                            </h2>
                            <p className="text-muted-foreground text-center">
                                Por favor espera mientras verificamos tu solicitud...
                            </p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <h2 className="text-2xl font-bold text-center text-green-600">
                                ¡Token Válido!
                            </h2>
                            <p className="text-muted-foreground text-center">
                                {message}
                            </p>
                            {email && (
                                <div className="bg-muted/50 rounded-md p-4 w-full">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Cuenta: <span className="font-medium text-foreground">{email}</span>
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Redirigiendo...</span>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center space-y-6">
                            <XCircle className="h-16 w-16 text-destructive" />
                            <h2 className="text-2xl font-bold text-center text-destructive">
                                Error al Verificar
                            </h2>
                            <p className="text-muted-foreground text-center">
                                {message}
                            </p>
                            
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 w-full">
                                <p className="text-sm text-destructive text-center">
                                    El enlace puede haber expirado o ser inválido.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <Button
                                    onClick={handleRequestNewToken}
                                    className="flex-1"
                                    variant="default"
                                >
                                    Solicitar Nuevo Enlace
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={() => router.push("/login")}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Volver al Login
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
