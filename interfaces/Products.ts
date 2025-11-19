export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    category_id: number;
    image_url: string | null;
    created_at: string | null;
    is_active?: boolean;
    updated_at?: string | null;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface ProductsResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        products: Product[];
        pagination: Pagination;
    };
}

export interface ProductResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: Product;
}

// ==================== AUTH ====================
export interface AuthHeaders {
  Authorization: string; // "Bearer {token}"
}

// ==================== PRODUCTS ADMIN ====================

// Producto con campos de admin (incluye is_active)
export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// Lista de productos (admin)
export interface AdminListProductsParams {
  page?: number;
  limit?: number;
  category_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  is_active?: boolean;
}

export interface AdminListProductsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    products: AdminProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

// Crear producto
export interface CreateProductRequest {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  image_url?: string | null;
}

export interface CreateProductResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    category_id: number;
    image_url: string | null;
    is_active: boolean;
    created_at: string | null;
  };
}

// Actualizar producto
export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  category_id?: number;
  image_url?: string | null;
  is_active?: boolean;
}

export interface UpdateProductResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: AdminProduct;
}

// Eliminar producto
export interface DeleteProductResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    id: number;
    name: string;
    is_active: boolean;
  };
}

// ==================== ERRORS ====================
export type AdminErrorCode =
  | "FORBIDDEN"
  | "PRODUCT_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "DUPLICATE_SLUG"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "AUTHENTICATION_REQUIRED"
  | "TOKEN_EXPIRED"
  | "TOKEN_REVOKED";

export interface ApiError {
  success: false;
  status_code: number;
  message: string;
  error: AdminErrorCode;
}

// Estructura con wrapper detail (como viene de la API)
export interface ApiErrorWrapper {
  detail: ApiError;
}

// ==================== CATEGORIES ====================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string | null;
  is_active?: boolean;
}

export interface CategoryListResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    categories: Category[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

export interface CategoryResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    created_at: string | null;
  };
}

// ==================== UPLOADS ====================

export interface UploadImageResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    file_url: string;
    file_name: string;
    file_size: number;
  };
}

// ==================== API WRAPPER ====================
// Generic response type
export type ApiResponse<T> = 
  | (T & { success: true })
  | ApiError;