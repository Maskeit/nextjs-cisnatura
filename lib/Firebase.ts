import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    Auth,
    UserCredential,
    signOut as firebaseSignOut
} from "firebase/auth";

// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase solo si no ha sido inicializado previamente
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth: Auth = getAuth(app);

// ============================================
// PROVIDER DE GOOGLE
// ============================================

const googleProvider = new GoogleAuthProvider();
// Configurar el provider para solicitar permisos específicos
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Forzar selección de cuenta cada vez (opcional, para múltiples cuentas)
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// ============================================
// INTERFACES
// ============================================

export interface GoogleAuthData {
    // Token de Firebase (idToken) - Este es el que envías a tu backend
    firebaseToken: string;
    // Datos del usuario de Google
    user: {
        uid: string;              // ID único de Firebase
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
        emailVerified: boolean;
    };
    // Token de acceso de Google (para llamadas a APIs de Google si necesitas)
    googleAccessToken?: string;
    // Indica si es un usuario nuevo en Firebase
    isNewUser: boolean;
}

export interface FirebaseAuthError {
    code: string;
    message: string;
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Inicia sesión con Google usando Firebase Authentication
 * @returns Promise con los datos de autenticación o null en caso de error
 */
export async function loginWithGoogle(): Promise<GoogleAuthData | null> {
    try {
        // Abrir popup de Google
        const result: UserCredential = await signInWithPopup(auth, googleProvider);
        
        // Obtener el credential de Google
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const googleAccessToken = credential?.accessToken;

        // Obtener el ID Token de Firebase (JWT)
        // Este token es el que debes enviar a tu backend
        const firebaseToken = await result.user.getIdToken();

        // Preparar los datos del usuario
        const authData: GoogleAuthData = {
            firebaseToken,
            user: {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                emailVerified: result.user.emailVerified,
            },
            googleAccessToken,
            // @ts-ignore - La propiedad _tokenResponse existe pero no está en los tipos
            isNewUser: result._tokenResponse?.isNewUser ?? false,
        };

        console.log('✅ Login con Google exitoso:', {
            uid: authData.user.uid,
            email: authData.user.email,
            isNewUser: authData.isNewUser
        });

        return authData;

    } catch (error: any) {
        const firebaseError = error as FirebaseAuthError;
        
        // Manejar errores específicos de Firebase
        console.error('❌ Error al iniciar sesión con Google:', {
            code: firebaseError.code,
            message: firebaseError.message
        });

        // Errores comunes:
        // auth/popup-closed-by-user - Usuario cerró el popup
        // auth/cancelled-popup-request - Se canceló la solicitud
        // auth/popup-blocked - El navegador bloqueó el popup
        // auth/account-exists-with-different-credential - Email ya existe con otro método

        return null;
    }
}

/**
 * Cierra la sesión de Firebase
 */
export async function signOutFirebase(): Promise<boolean> {
    try {
        await firebaseSignOut(auth);        
        return true;
    } catch (error) {
        console.error('❌ Error al cerrar sesión de Firebase:', error);
        return false;
    }
}

/**
 * Obtiene el token actual de Firebase del usuario autenticado
 * @param forceRefresh - Si es true, fuerza la renovación del token
 * @returns El token de Firebase o null si no hay usuario
 */
export async function getFirebaseToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return null;
        }
        
        const token = await currentUser.getIdToken(forceRefresh);
        return token;
    } catch (error) {
        console.error('❌ Error al obtener token de Firebase:', error);
        return null;
    }
}

/**
 * Verifica si hay un usuario autenticado en Firebase
 * @returns true si hay un usuario autenticado
 */
export function isFirebaseAuthenticated(): boolean {
    return auth.currentUser !== null;
}

/**
 * Obtiene el usuario actual de Firebase
 */
export function getCurrentFirebaseUser() {
    return auth.currentUser;
}
