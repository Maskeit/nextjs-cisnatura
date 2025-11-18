"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthAPI } from "@/lib/Auth";
import { cookieStorage } from "@/lib/cookies";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import Link from "next/link";
import type { VerifyEmailResponse } from "@/interfaces/User";

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (token) {
            verifyEmail(token);
        } else {
            setStatus("error");
            setMessage("Token de verificación no proporcionado");
        }
    }, [token]);

    const verifyEmail = async (verificationToken: string) => {
        try {
            const response: VerifyEmailResponse = await AuthAPI.verifyEmail({ token: verificationToken });
            
            if (response && response.data?.email_verified) {
                setStatus("success");
                setMessage(response.message);
                
                const user = cookieStorage.getUser();
                toast.success(`¡Bienvenido${user?.full_name ? `, ${user.full_name}` : ''}!`, {
                    description: response.message,
                });
                
                // Redirigir al home después de 2 segundos
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch (err: any) {
            console.error("Error al verificar email:", err);
            
            let errorMessage = "Error al verificar el correo electrónico";
            
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

    const handleResendVerification = async () => {
        const user = cookieStorage.getUser();
        const email = user?.email;
        
        if (!email) {
            toast.error("No se pudo obtener el correo electrónico");
            return;
        }
        
        setIsResending(true);
        
        try {
            const response = await AuthAPI.resendVerification({ email });
            
            if (response.success) {
                toast.success("Correo de verificación reenviado", {
                    description: response.message,
                });
            } else {
                toast.error(response.message);
            }
        } catch (err: any) {
            console.error("Error al reenviar verificación:", err);
            
            let errorMessage = "Error al reenviar el correo";
            
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.detail) {
                const errorDetail = err.response.data.detail;
                if (errorDetail.message) {
                    errorMessage = errorDetail.message;
                } else if (typeof errorDetail === "string") {
                    errorMessage = errorDetail;
                }
            } else if (err.response?.status === 400) {
                errorMessage = "El email ya está verificado o no existe";
            }
            
            toast.error(errorMessage);
        } finally {
            setIsResending(false);
        }
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
                                Verificando tu correo
                            </h2>
                            <p className="text-muted-foreground text-center">
                                Por favor espera mientras verificamos tu cuenta...
                            </p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <h2 className="text-2xl font-bold text-center text-green-600">
                                ¡Verificación exitosa!
                            </h2>
                            <p className="text-muted-foreground text-center">
                                {message}
                            </p>
                            <p className="text-sm text-muted-foreground text-center">
                                Serás redirigido automáticamente...
                            </p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center space-y-6">
                            <XCircle className="h-16 w-16 text-destructive" />
                            <h2 className="text-2xl font-bold text-center text-destructive">
                                Error de verificación
                            </h2>
                            <p className="text-muted-foreground text-center">
                                {message}
                            </p>
                            
                            <div className="w-full space-y-3">
                                <Button
                                    onClick={handleResendVerification}
                                    disabled={isResending}
                                    className="w-full"
                                    variant="default"
                                >
                                    {isResending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Reenviando...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="mr-2 h-5 w-5" />
                                            Reenviar correo de verificación
                                        </>
                                    )}
                                </Button>
                                
                                <Link href="/login" className="block">
                                    <Button variant="outline" className="w-full">
                                        Volver al inicio de sesión
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
