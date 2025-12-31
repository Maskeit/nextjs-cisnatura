/**
 * Configuración del cliente HTTP Axios.
 * 
 * ARQUITECTURA DE AUTENTICACIÓN:
 * ==============================
 * El backend usa cookies HttpOnly para tokens (más seguro que localStorage).
 * 
 * - withCredentials: true -> Envía cookies automáticamente en cada request
 * - Las cookies HttpOnly son manejadas por el navegador, no por JS
 * - El backend valida tanto cookies HttpOnly como Bearer tokens (compatibilidad)
 * 
 * Para CSRF (si está habilitado), el frontend lee csrf_token de cookie
 * y lo envía en el header X-CSRF-Token.
 */
import axios, { AxiosError } from "axios";
import type { ApiErrorResponseWrapper } from "@/interfaces/User";
import Cookies from 'js-cookie';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,  // IMPORTANTE: Enviar cookies HttpOnly automáticamente
});

// Variable para evitar múltiples redirecciones simultáneas
let isRedirecting = false;

// Función para limpiar sesión y redirigir al login
function handleSessionExpired() {
  if (isRedirecting) return;
  isRedirecting = true;

  // Limpiar cookies que SÍ podemos acceder desde JS usando js-cookie
  if (typeof window !== 'undefined') {
    // Eliminar cookies de autenticación usando js-cookie
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
    Cookies.remove('user_data', { path: '/' });
    Cookies.remove('csrf_token', { path: '/' });

    // Limpiar localStorage relacionado con checkout/carrito
    localStorage.removeItem('selected_address_id');
    localStorage.removeItem('last_order_id');

    // Eliminar header de autorización
    delete api.defaults.headers.common['Authorization'];

    // Redirigir al login con la ruta actual como redirect
    const currentPath = window.location.pathname;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}&session_expired=true`;
    window.location.href = loginUrl;

    // Resetear flag después de un momento
    setTimeout(() => {
      isRedirecting = false;
    }, 1000);
  }
}

// Interceptor de request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Agregar token CSRF si existe (para protección CSRF)
      const csrfToken = Cookies.get('csrf_token');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }

      // IMPORTANTE: Siempre enviar el access_token en el header Authorization
      // Esto asegura compatibilidad independiente de si las cookies HttpOnly funcionan
      // El backend acepta tanto cookies HttpOnly como Bearer token
      if (!config.headers.Authorization) {
        // Usar js-cookie para leer de manera más confiable
        const token = Cookies.get('access_token');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
      // Verificar que no sea una llamada a endpoints públicos o de auth
      const url = error.config?.url || '';
      const isPublicEndpoint = url.includes('/auth/') ||
        url.includes('/products/') ||
        url.includes('/categories/');

      // Solo redirigir si estamos en una página protegida Y tenemos cookies de sesión
      // Usamos js-cookie para verificar de manera más confiable
      const hasSessionCookies = typeof window !== 'undefined' &&
        !!Cookies.get('access_token');

      if (!isPublicEndpoint && hasSessionCookies) {
        // Token inválido o expirado - cerrar sesión automáticamente
        console.warn('Sesión expirada o token inválido. Cerrando sesión...');
        handleSessionExpired();
      }
    }

    return Promise.reject(error);
  }
);