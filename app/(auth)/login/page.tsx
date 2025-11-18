"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthAPI } from "@/lib/Auth";
import { cookieStorage } from "@/lib/cookies";
import { UserLogin } from "@/interfaces/User";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (values: UserLogin) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthAPI.login(values);
      
      if (response && response.data) {
        const { access_token, refresh_token, user } = response.data;
        
        // Guardar tokens y usuario en cookies
        cookieStorage.setAuth(access_token, refresh_token, user);
        
        // Configurar token en axios para futuras peticiones
        AuthAPI.setAuthToken(access_token);
        
        // Verificar si el email está verificado
        if (!user.email_verified) {
          toast.warning('Por favor verifica tu correo electrónico antes de continuar');
          router.push('/verify-email');
          return;
        }
        
        // Toast de éxito
        toast.success(`¡Bienvenido, ${user.full_name}!`);
        
        // Redirigir al home o a la página solicitada
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      } else {
        const errorMsg = 'Error al iniciar sesión';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      
      let errorMessage = 'Error al iniciar sesión. Por favor intenta de nuevo.';
      
      // La API devuelve los errores en err.response.data.detail
      if (err.response?.data?.detail) {
        const errorDetail = err.response.data.detail;
        
        // Si detail es un objeto con el formato de tu API
        if (errorDetail.message) {
          errorMessage = errorDetail.message;
        } else if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        }
      } else if (err.response?.data?.message) {
        // Fallback por si la estructura cambia
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Correo electrónico o contraseña incorrectos';
      } else if (err.response?.status === 403) {
        errorMessage = 'Tu cuenta no está activa. Por favor verifica tu correo electrónico.';
      } else if (!err.response) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-muted/30 py-12">
      <LoginForm 
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
