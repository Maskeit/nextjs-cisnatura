import Cookies from 'js-cookie';
import { UserResponse } from '@/interfaces/User';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Configuración de cookies (7 días de expiración)
const COOKIE_OPTIONS = {
  expires: 7, // días
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
  sameSite: 'lax' as const,
  path: '/',
};

export const cookieStorage = {
  // Guardar tokens y usuario
  setAuth(accessToken: string, refreshToken: string, user: UserResponse) {
    Cookies.set(TOKEN_KEY, accessToken, COOKIE_OPTIONS);
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, COOKIE_OPTIONS);
    Cookies.set(USER_KEY, JSON.stringify(user), COOKIE_OPTIONS);
  },

  // Obtener access token
  getAccessToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },

  // Obtener refresh token
  getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  // Obtener usuario
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

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  // Limpiar todos los datos de autenticación
  clearAuth() {
    Cookies.remove(TOKEN_KEY, { path: '/' });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
    Cookies.remove(USER_KEY, { path: '/' });
  },

  // Actualizar solo el access token (útil para refresh)
  setAccessToken(token: string) {
    Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
  },
};
