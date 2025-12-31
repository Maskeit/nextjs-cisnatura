"use client"

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthAPI } from "@/lib/Auth";
import { cookieStorage } from "@/lib/cookies";
import { UserLogin } from "@/interfaces/User";
import { loginWithGoogle, signOutFirebase } from "@/lib/Firebase";

import { ArrowBigLeftDashIcon } from "lucide-react"

// Componente separado para manejar los searchParams
function SessionExpiredHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionExpired = searchParams.get('session_expired');
    if (sessionExpired === 'true') {
      toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    }
  }, [searchParams]);

  return null;
}

function LoginContent() {
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
        // Usamos window.location.href para forzar recarga completa y que el navbar detecte la sesión
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect') || '/';
        window.location.href = redirect;
      } else {
        const errorMsg = 'Error al iniciar sesión';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);

      let errorMessage = 'Error al iniciar sesión. Por favor intenta de nuevo.';

      // El interceptor ya extrajo el detail, ahora err.response.data tiene la estructura correcta
      if (err.response?.data?.message) {
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Autenticar con Firebase/Google
      const googleAuthData = await loginWithGoogle();

      if (!googleAuthData) {
        setError('Error al iniciar sesión con Google');
        toast.error('Error al iniciar sesión con Google');
        return;
      }

      // 2. Enviar el token de Firebase a tu backend
      // Tu backend debe validar este token y crear/actualizar el usuario
      const response = await AuthAPI.loginWithGoogle({
        firebase_token: googleAuthData.firebaseToken
      });

      if (response && response.data) {
        const { access_token, refresh_token, user, is_new_user } = response.data;

        // 3. Guardar los tokens de tu backend en cookies
        cookieStorage.setAuth(access_token, refresh_token, user);

        // 4. Configurar token en axios para futuras peticiones
        AuthAPI.setAuthToken(access_token);

        // 5. Toast de éxito
        toast.success(`¡Bienvenido, ${user.full_name}!`, {
          description: is_new_user ? 'Tu cuenta ha sido creada exitosamente' : 'Has iniciado sesión correctamente'
        });

        // 6. Redirigir al home o a la página solicitada
        // Usamos window.location.href para forzar recarga completa y que el navbar detecte la sesión
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect') || '/';
        window.location.href = redirect;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }

    } catch (err: any) {
      console.error('Error al iniciar sesión con Google:', err);

      // Si falla, cerrar sesión de Firebase
      await signOutFirebase();

      let errorMessage = 'Error al iniciar sesión con Google. Por favor intenta de nuevo.';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'No se pudo verificar tu cuenta de Google';
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
    <>
      <Suspense fallback={null}>
        <SessionExpiredHandler />
      </Suspense>
      <div className="bg-muted flex min-h-svh flex-col justify-center items-center p-6 md:p-10">
        <div className="bg-muted w-full max-w-sm md:max-w-4xl">
          <div className="flex justify-center gap-2 md:justify-start mb-4">
            <a href="/" className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <ArrowBigLeftDashIcon className="size-4" />
              </div>
              Volver a CISnatura
            </a>
          </div>
          <LoginForm
            onSubmit={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            isLoading={isLoading}
            error={error} />
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}