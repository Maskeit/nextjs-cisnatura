/**
 * Gestión de cookies para autenticación.
 * 
 * ARQUITECTURA DE SEGURIDAD:
 * ==========================
 * 
 * El backend ahora establece cookies HttpOnly para access_token y refresh_token.
 * Estas cookies NO son accesibles desde JavaScript (protección contra XSS).
 * 
 * - access_token: Cookie HttpOnly (establecida por backend)
 * - refresh_token: Cookie HttpOnly (establecida por backend)
 * - csrf_token: Cookie NO HttpOnly (JS puede leerla para enviar en header)
 * - user_data: Cookie NO HttpOnly (para mostrar info del usuario en UI)
 * 
 * El frontend YA NO necesita guardar tokens - el backend los envía como cookies
 * y el navegador los incluye automáticamente en cada request.
 * 
 * Para APIs/fetch, usar credentials: 'include' para enviar cookies.
 */
import Cookies from 'js-cookie';
import { UserResponse } from '@/interfaces/User';

// Cookies que SÍ podemos leer desde JS (NO HttpOnly)
const USER_KEY = 'user_data';
const CSRF_TOKEN_KEY = 'csrf_token';

// Cookies que NO podemos leer desde JS (HttpOnly - las maneja el backend)
// Estas constantes son solo para referencia
// const ACCESS_TOKEN_KEY = 'access_token';  // HttpOnly
// const REFRESH_TOKEN_KEY = 'refresh_token'; // HttpOnly

// Configuración para cookies que SÍ creamos desde JS
const COOKIE_OPTIONS = {
  expires: 7, // días
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const cookieStorage = {
  /**
   * Guardar datos del usuario después del login.
   * NOTA: Los tokens (access_token, refresh_token) ya son establecidos
   * como cookies HttpOnly por el backend, no los guardamos aquí.
   */
  setAuth(accessToken: string, refreshToken: string, user: UserResponse) {
    // Solo guardamos user_data que necesitamos para la UI
    // Los tokens vienen como cookies HttpOnly desde el backend
    Cookies.set(USER_KEY, JSON.stringify(user), COOKIE_OPTIONS);

    // Para compatibilidad temporal con código que aún no migra a HttpOnly,
    // también guardamos los tokens (el backend los envía en el body)
    // TODO: Eliminar esto cuando el frontend migre completamente a HttpOnly
    Cookies.set('access_token', accessToken, COOKIE_OPTIONS);
    Cookies.set('refresh_token', refreshToken, COOKIE_OPTIONS);
  },

  /**
   * Obtener access token.
   * Con HttpOnly habilitado, esto retornará undefined porque JS no puede leerlo.
   * El navegador enviará la cookie automáticamente con credentials: 'include'.
   * 
   * @deprecated Usar credentials: 'include' en fetch para enviar cookies automáticamente
   */
  getAccessToken(): string | undefined {
    return Cookies.get('access_token');
  },

  /**
   * Obtener refresh token.
   * @deprecated Con HttpOnly, el navegador maneja esto automáticamente
   */
  getRefreshToken(): string | undefined {
    return Cookies.get('refresh_token');
  },

  /**
   * Obtener token CSRF para protección de formularios.
   * Este token SÍ es legible desde JS.
   */
  getCsrfToken(): string | undefined {
    return Cookies.get(CSRF_TOKEN_KEY);
  },

  /**
   * Obtener datos del usuario para mostrar en la UI.
   */
  getUser(): UserResponse | null {
    const userData = Cookies.get(USER_KEY);
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Verificar si está autenticado.
   * Verifica si tenemos datos de usuario (ya que no podemos leer el token HttpOnly).
   */
  isAuthenticated(): boolean {
    // Primero intentar leer access_token (para compatibilidad)
    const token = Cookies.get('access_token');
    if (token) return true;

    // Fallback: verificar si tenemos datos de usuario
    return this.getUser() !== null;
  },

  /**
   * Limpiar todos los datos de autenticación del lado del cliente.
   * NOTA: Las cookies HttpOnly las limpia el backend en /auth/logout
   */
  clearAuth() {
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
    Cookies.remove(USER_KEY, { path: '/' });
    Cookies.remove(CSRF_TOKEN_KEY, { path: '/' });
  },

  /**
   * Actualizar datos del usuario.
   */
  setUser(user: UserResponse) {
    Cookies.set(USER_KEY, JSON.stringify(user), COOKIE_OPTIONS);
  },

  /**
   * Actualizar solo el access token.
   * @deprecated Con HttpOnly, el backend maneja esto
   */
  setAccessToken(token: string) {
    Cookies.set('access_token', token, COOKIE_OPTIONS);
  },
};
