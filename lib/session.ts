/**
 * Utilidades para gestión de sesión y limpieza de datos
 */

import { cookieStorage } from './cookies';
import { api } from './api';

/**
 * Limpia completamente la sesión del usuario
 * Incluye cookies, localStorage, y headers de axios
 */
export function clearSession(): void {
  // Limpiar cookies de autenticación
  cookieStorage.clearAuth();
  
  // Limpiar header de autorización de axios
  delete api.defaults.headers.common['Authorization'];
  
  // Limpiar datos de checkout/carrito del localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('selected_address_id');
    localStorage.removeItem('last_order_id');
  }
}

/**
 * Verifica si la sesión es válida
 * Chequea que existan tanto el token como los datos de usuario
 */
export function isSessionValid(): boolean {
  const token = cookieStorage.getAccessToken();
  const user = cookieStorage.getUser();
  
  return !!token && !!user;
}

/**
 * Redirige al login limpiando la sesión
 * @param currentPath - Ruta actual para redirect después del login
 * @param reason - Razón de la redirección (opcional)
 */
export function redirectToLogin(currentPath?: string, reason?: 'expired' | 'invalid'): void {
  if (typeof window === 'undefined') return;
  
  clearSession();
  
  const path = currentPath || window.location.pathname;
  let loginUrl = `/login?redirect=${encodeURIComponent(path)}`;
  
  if (reason === 'expired') {
    loginUrl += '&session_expired=true';
  } else if (reason === 'invalid') {
    loginUrl += '&session_invalid=true';
  }
  
  window.location.href = loginUrl;
}

/**
 * Inicializa la sesión desde las cookies
 * Configura el token de axios si existe una sesión válida
 */
export function initializeSession(): boolean {
  if (!isSessionValid()) {
    clearSession();
    return false;
  }
  
  const token = cookieStorage.getAccessToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  }
  
  return false;
}
