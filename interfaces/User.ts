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
    auth_provider?: string;
    profile_image?: string | null;
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
        is_new_user?: boolean;
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

// Estructura base de error (lo que viene dentro de detail)
export interface BaseErrorResponse {
    success: false;
    status_code: number;
    message: string;
    error: string;
}

export interface ValidationErrorResponse extends BaseErrorResponse {
    status_code: 400;
    error: "VALIDATION_ERROR";
    details: ValidationErrorDetail[];
}

export interface AuthErrorResponse extends BaseErrorResponse {
    error: "AUTHENTICATION_REQUIRED" | "UNAUTHORIZED" | "FORBIDDEN" | "TOKEN_EXPIRED" | "TOKEN_REVOKED" | "INVALID_CREDENTIALS";
}

// Estructura completa de error de la API (con wrapper detail)
export interface ApiErrorResponseWrapper {
    detail: ValidationErrorResponse | AuthErrorResponse | BaseErrorResponse;
}

// Union type para manejar respuestas de error
export type ApiErrorResponse = ValidationErrorResponse | AuthErrorResponse | BaseErrorResponse;

// ==================== USER PROFILE TYPES ====================

export interface UserProfileResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: UserResponse;
}

export interface UserOrderSummary {
    id: number;
    status: string;
    total: number;
    created_at: string;
}

export interface UserProfileSummary {
    profile: UserResponse;
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    total_spent: number;
    total_addresses: number;
    has_default_address: boolean;
    last_order: UserOrderSummary | null;
}

export interface UserProfileSummaryResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: UserProfileSummary;
}

export interface UserUpdateProfile {
    full_name?: string;
}

export interface UserChangePassword {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

export interface UserChangePasswordResponse {
    success: boolean;
    status_code: number;
    message: string;
}

export interface UserDeleteResponse {
    success: boolean;
    status_code: number;
    message: string;
}

// ==================== ADMIN USER TYPES ====================

export interface UserAdminDetails extends UserResponse {
    total_orders: number;
    total_spent: number;
    total_addresses: number;
    recent_orders: UserOrderSummary[];
}

export interface UserAdminDetailsResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: UserAdminDetails;
}

export interface UserAdminListItem extends UserResponse {
    total_orders: number;
    total_spent: number;
    total_addresses: number;
}

export interface UserPagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface UserAdminListResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        users: UserAdminListItem[];
        pagination: UserPagination;
    };
}

export interface UserAdminListParams {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    is_admin?: boolean;
    email_verified?: boolean;
    created_from?: string;
    created_to?: string;
}

export interface UserAdminUpdate {
    full_name?: string;
    is_active?: boolean;
    is_admin?: boolean;
    email_verified?: boolean;
}

export interface UserBanRequest {
    reason?: string;
}

export interface UserBanResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        user_id: string;
        email: string;
        is_active: boolean;
        reason?: string;
    };
}

export interface UserUnbanResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        user_id: string;
        email: string;
        is_active: boolean;
    };
}

export interface TopSpender {
    user_id: string;
    email: string;
    full_name: string;
    total_orders: number;
    total_spent: number;
}

export interface UserStatsResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        total_users: number;
        active_users: number;
        inactive_users: number;
        admin_users: number;
        verified_users: number;
        unverified_users: number;
        new_users_today: number;
        new_users_this_week: number;
        new_users_this_month: number;
        top_spenders: TopSpender[];
    };
}

// Error codes específicos de usuarios
export type UserErrorCode =
    | "AUTHENTICATION_REQUIRED"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "INVALID_PASSWORD"
    | "PENDING_ORDERS"
    | "CANNOT_DEMOTE_SELF"
    | "CANNOT_BAN_ADMIN"
    | "CANNOT_BAN_SELF"
    | "CANNOT_DELETE_ADMIN"
    | "CANNOT_DELETE_SELF"
    | "USER_NOT_FOUND"
    | "VALIDATION_ERROR";
