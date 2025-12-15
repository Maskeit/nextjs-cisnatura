'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/lib/Auth';
import { cookieStorage } from '@/lib/cookies';
import { UserResponse } from '@/interfaces/User';
import { toast } from 'sonner';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializar autenticación al cargar
    checkAuth();
  }, []);

  // Reinicializar el token en axios cada vez que se detecte que hay cookies
  useEffect(() => {
    if (user) {
      const token = cookieStorage.getAccessToken();
      if (token) {
        AuthAPI.setAuthToken(token);
      }
    }
  }, [user]);

  const checkAuth = () => {
    try {
      const currentUser = AuthAPI.getCurrentUser();
      setUser(currentUser);
      
      // Configurar axios con el token de las cookies
      AuthAPI.initializeAuth();
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logoutAndClear();
      setUser(null);
      toast.success('Sesión cerrada exitosamente');
      // Forzar recarga de la página para limpiar todo el estado
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const isAuthenticated = () => {
    return AuthAPI.isAuthenticated();
  };

  return {
    user,
    isLoading,
    isAuthenticated: isAuthenticated(),
    logout,
    checkAuth,
  };
}
