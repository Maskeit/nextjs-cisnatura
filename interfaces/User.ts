export interface UserRegister {
    email: string;
    password: string;
    full_name: string;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface UserResponse {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    is_admin: boolean;
    email_verified: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface LoginResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: UserResponse;
    };
}

export interface RegisterResponse {
    success: boolean;
    status_code: number;
    message: string;
    data?: {
        user_id: string;
        email: string;
        email_verified: boolean;
    };
    error?: string;
}

export interface VerifyEmailResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        email_verified: boolean;
    };
}

export interface ResendVerificationResponse {
    success: boolean;
    status_code: number;
    message: string;
}

// ==================== ERROR TYPES ====================

export interface ValidationErrorDetail {
    field: string;
    message: string;
    type: string;
    input: any;
}

export interface ValidationErrorResponse {
    success: false;
    status_code: 400;
    message: string;
    error: "VALIDATION_ERROR";
    details: ValidationErrorDetail[];
}

export interface AuthErrorResponse {
    success: false;
    status_code: number;
    message: string;
    error: string;
}

// Union type para manejar respuestas de error
export type ApiErrorResponse = ValidationErrorResponse | AuthErrorResponse;
