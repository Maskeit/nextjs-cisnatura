import { api } from '@/lib/api';
import { cookieStorage } from '@/lib/cookies';
import { UserRegister, UserLogin, UserResponse, LoginResponse, RegisterResponse, VerifyEmailResponse, ResendVerificationResponse } from '@/interfaces/User';

export const AuthAPI = {
    // Registro y Verificación
    async register(data: UserRegister): Promise<RegisterResponse> {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async verifyEmail(data: { token: string }): Promise<VerifyEmailResponse> {
        const response = await api.post('/auth/verify-email', data);
        return response.data;
    },

    async resendVerification(data: { email: string }): Promise<ResendVerificationResponse> {
        const response = await api.post('/auth/resend-verification', data);
        return response.data;
    },

    // Autenticación
    async login(data: UserLogin): Promise<LoginResponse> {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    // Login con Google (Firebase)
    async loginWithGoogle(data: { firebase_token: string }): Promise<LoginResponse> {
        const response = await api.post('/auth/google-login', data);
        return response.data;
    },

    async logout(): Promise<{ success: boolean; status_code: number; message: string }> {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    async getMe(token: string): Promise<UserResponse> {
        const response = await api.get('/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Helpers para tokens
    setAuthToken(token: string) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    removeAuthToken() {
        delete api.defaults.headers.common['Authorization'];
    },

    // Helper completo para cerrar sesión
    async logoutAndClear(): Promise<void> {
        try {
            // Intentar hacer logout en el backend
            await this.logout();
        } catch (error) {
            console.error('Error al cerrar sesión en el backend:', error);
        } finally {
            // Limpiar tokens de las cookies y axios siempre
            this.removeAuthToken();
            cookieStorage.clearAuth();
            
            // Limpiar localStorage relacionado con checkout/carrito
            if (typeof window !== 'undefined') {
                localStorage.removeItem('selected_address_id');
                localStorage.removeItem('last_order_id');
            }
        }
    },

    // Helper para inicializar axios con el token de las cookies
    initializeAuth(): void {
        const token = cookieStorage.getAccessToken();
        if (token) {
            this.setAuthToken(token);
        }
    },

    // Helper para obtener el usuario actual de las cookies
    getCurrentUser(): UserResponse | null {
        return cookieStorage.getUser();
    },

    // Helper para verificar si está autenticado
    isAuthenticated(): boolean {
        return cookieStorage.isAuthenticated();
    },
};
