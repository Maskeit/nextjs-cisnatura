import axios, { AxiosError } from "axios";
import type { ApiErrorResponseWrapper } from "@/interfaces/User";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Variable para evitar múltiples redirecciones simultáneas
let isRedirecting = false;

// Función para limpiar sesión y redirigir al login
function handleSessionExpired() {
  if (isRedirecting) return;
  isRedirecting = true;

  // Limpiar cookies
  if (typeof window !== 'undefined') {
    // Eliminar cookies de autenticación
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Limpiar localStorage relacionado con checkout/carrito
    localStorage.removeItem('selected_address_id');
    localStorage.removeItem('last_order_id');
    
    // Eliminar header de autorización
    delete api.defaults.headers.common['Authorization'];
    
    // Redirigir al login con la ruta actual como redirect
    const currentPath = window.location.pathname;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}&session_expired=true`;
    window.location.href = loginUrl;
  }
}

// Interceptor para manejar errores y extraer el contenido de 'detail'
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponseWrapper>) => {
    // Si la respuesta tiene la estructura { detail: { ... } }, extraer el detail
    if (error.response?.data?.detail) {
      // Reemplazar error.response.data con el contenido de detail
      error.response.data = error.response.data.detail as any;
    }
    
    // Manejar errores 401 (No autorizado / Token inválido o expirado)
    if (error.response?.status === 401) {
      // Verificar que no sea una llamada a /auth/login o /auth/register
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                            error.config?.url?.includes('/auth/register') ||
                            error.config?.url?.includes('/auth/verify-email') ||
                            error.config?.url?.includes('/auth/google-login');
      
      if (!isAuthEndpoint) {
        // Token inválido o expirado - cerrar sesión automáticamente
        console.warn('Sesión expirada o token inválido. Cerrando sesión...');
        handleSessionExpired();
      }
    }
    
    return Promise.reject(error);
  }
);