// ==================== DISCOUNT TYPES ====================

export interface CategoryDiscount {
  percentage: number;
  name: string;
}

export interface ProductDiscount {
  percentage: number;
  name: string;
}

export interface SeasonalOffer {
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  discount_percentage: number;
  category_ids: string[] | null;
  product_ids: string[] | null;
}

// ==================== ADMIN SETTINGS ====================

export interface AdminSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  shipping_price: number;
  free_shipping_threshold: number | null;
  categories_no_shipping: number[];
  global_discount_enabled: boolean;
  global_discount_percentage: number;
  global_discount_name: string | null;
  category_discounts: Record<string, CategoryDiscount>;
  product_discounts: Record<string, ProductDiscount>;
  seasonal_offers: SeasonalOffer[];
  allow_user_registration: boolean;
  max_items_per_order: number;
  created_at?: string;
  updated_at?: string;
}

// ==================== REQUEST BODIES ====================

export interface UpdateMaintenanceRequest {
  maintenance_mode: boolean;
  maintenance_message?: string;
}

export interface UpdateShippingRequest {
  shipping_price: number;
  free_shipping_threshold?: number | null;
}

export interface UpdateCategoriesNoShippingRequest {
  category_ids: number[];
}

export interface UpdateGlobalDiscountRequest {
  enabled: boolean;
  percentage: number;
  name?: string;
}

export interface AddCategoryDiscountRequest {
  category_id: string;
  percentage: number;
  name: string;
}

export interface AddProductDiscountRequest {
  product_id: string;
  percentage: number;
  name: string;
}

export interface CreateSeasonalOfferRequest {
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  discount_percentage: number;
  category_ids?: string[] | null;
  product_ids?: string[] | null;
}

export interface UpdateUserRegistrationRequest {
  allow_user_registration: boolean;
}

export interface UpdateMaxItemsRequest {
  max_items_per_order: number;
}

// ==================== API RESPONSES ====================

export interface AdminSettingsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: AdminSettings;
}

export interface AdminSettingsUpdateResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: AdminSettings;
}

// Respuestas específicas para cada panel
export interface MaintenanceResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    maintenance_mode: boolean;
    maintenance_message: string | null;
  };
}

export interface ShippingResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    shipping_price: number;
    free_shipping_threshold: number | null;
  };
}

export interface AllDiscountsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    global: {
      enabled: boolean;
      percentage: number;
      name: string | null;
    };
    categories: Record<string, CategoryDiscount>;
    products: Record<string, ProductDiscount>;
  };
}

export interface GlobalDiscountResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    enabled: boolean;
    percentage: number;
    name: string | null;
  };
}

export interface CategoryDiscountsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    category_discounts: Record<string, CategoryDiscount>;
  };
}

export interface ProductDiscountsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    product_discounts: Record<string, ProductDiscount>;
  };
}

export interface SeasonalOffersResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    seasonal_offers: SeasonalOffer[];
  };
}

export interface RegistrationResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    allow_user_registration: boolean;
    max_items_per_order: number;
  };
}


export interface MaxItemsOperationResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    max_items_per_order: number;
  };
}

// ==================== ERROR TYPES ====================

export type AdminSettingsErrorCode =
  | "ADMIN_REQUIRED"
  | "SETTINGS_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "MAINTENANCE_MODE"
  | "UNAUTHORIZED"
  | "FORBIDDEN";

export interface AdminSettingsError {
  success: false;
  status_code: number;
  message: string;
  error: AdminSettingsErrorCode;
}
