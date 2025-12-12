"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthAPI } from "@/lib/Auth";
import { cookieStorage } from "@/lib/cookies";
import { UserRegister } from "@/interfaces/User";
import { loginWithGoogle, signOutFirebase } from "@/lib/Firebase";
import { ArrowBigLeftDashIcon } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (values: UserRegister & { confirm_password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Extraer solo los datos necesarios para el registro (sin confirm_password)
      const registerData: UserRegister = {
        email: values.email,
        password: values.password,
        full_name: values.full_name,
      };

      const response = await AuthAPI.register(registerData);

      if (response && response.data) {
        const { user_id, email } = response.data;

        // Toast de éxito
        toast.success(`¡Cuenta creada exitosamente!`, {
          description: 'Por favor verifica tu correo electrónico para activar tu cuenta.',
          duration: 5000,
        });

        // Redirigir al login o a una página de verificación de email
        router.push('/login?registered=true');
      } else {
        const errorMsg = 'Error al crear la cuenta';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error al registrar usuario:', err);

      let errorMessage = 'Error al crear la cuenta. Por favor intenta de nuevo.';

      // El interceptor ya extrajo el detail, ahora err.response.data tiene la estructura correcta
      if (err.response?.data) {
        const errorData = err.response.data;

        // Error de validación con detalles
        if (errorData.error === 'VALIDATION_ERROR' && errorData.details) {
          // Mostrar el mensaje general que ya incluye todos los errores
          errorMessage = errorData.message;

          // Opcionalmente, mostrar cada error individual como toast
          errorData.details.forEach((detail: any) => {
            toast.error(`${detail.field}: ${detail.message}`);
          });
        }
        // Error estructurado (EMAIL_ALREADY_EXISTS, etc)
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (!err.response) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Autenticar con Firebase/Google
      const googleAuthData = await loginWithGoogle();
      
      if (!googleAuthData) {
        setError('Error al registrarse con Google');
        toast.error('Error al registrarse con Google');
        return;
      }

      // 2. Enviar el token de Firebase a tu backend
      const response = await AuthAPI.loginWithGoogle({
        firebase_token: googleAuthData.firebaseToken
      });

      if (response && response.data) {
        const { access_token, refresh_token, user } = response.data;

        // 3. Si es usuario nuevo, redirigir al login
        if (googleAuthData.isNewUser) {
          toast.success('¡Cuenta creada exitosamente!', {
            description: 'Por favor inicia sesión para continuar',
            duration: 5000,
          });
          router.push('/login?registered=true');
        } else {
          // Usuario existente, configurar la sesión
          cookieStorage.setAuth(access_token, refresh_token, user);
          AuthAPI.setAuthToken(access_token);
          
          toast.success(`¡Bienvenido de nuevo, ${user.full_name}!`);
          router.push('/');
        }
      }

    } catch (err: any) {
      console.error('Error al registrarse con Google:', err);
      await signOutFirebase();

      let errorMessage = 'Error al registrarse con Google. Por favor intenta de nuevo.';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="bg-muted w-full max-w-sm md:max-w-4xl">
        <div className="flex justify-center gap-2 md:justify-start mb-4">
          <a href="/" className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <ArrowBigLeftDashIcon className="size-4" />
            </div>
            Volver a CISnatura
          </a>
        </div>
        <RegisterForm
          onSubmit={handleRegister}
          onGoogleLogin={handleGoogleRegister}
          isLoading={isLoading}
          error={error} />
      </div>
    </div>
  )
}