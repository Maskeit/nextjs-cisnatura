"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthAPI } from "@/lib/Auth";
import { UserRegister } from "@/interfaces/User";

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
          // errorData.details.forEach((detail: any) => {
          //   toast.error(`${detail.field}: ${detail.message}`);
          // });
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

  return (
    <div className="min-h-screen flex justify-center bg-muted/30 py-12">
      <RegisterForm 
        onSubmit={handleRegister}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
