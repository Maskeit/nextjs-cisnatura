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