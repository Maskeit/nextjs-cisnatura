// ==================== ADDRESS ====================
export interface Address {
  id: number;
  user_id: string;
  full_name: string;
  phone: string;
  rfc: string | null;
  label: string | null;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

// ==================== ADDRESS LIST ====================
export interface AddressList {
  addresses: Address[];
  total: number;
  max_addresses: number;
}

// ==================== API RESPONSES ====================
export interface AddressResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Address;
}

export interface AddressListResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: AddressList;
}

export interface AddressDeleteResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: null;
}

// ==================== REQUEST BODIES ====================
export interface CreateAddressRequest {
  full_name: string;
  phone: string;
  rfc?: string;
  label?: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface UpdateAddressRequest {
  full_name?: string;
  phone?: string;
  rfc?: string;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}

// ==================== ERRORS ====================
export type AddressErrorCode =
  | "ADDRESS_NOT_FOUND"
  | "MAX_ADDRESSES_REACHED"
  | "UNAUTHORIZED"
  | "AUTHENTICATION_REQUIRED"
  | "VALIDATION_ERROR";

export interface AddressApiError {
  success: false;
  status_code: number;
  message: string;
  error: AddressErrorCode;
}

// Estructura con wrapper detail (como viene de la API)
export interface AddressApiErrorWrapper {
  detail: AddressApiError;
}

// ==================== ESTADOS DATA ====================
export interface Municipio {
  nombre: string;
}

export interface Estado {
  nombre: string;
  municipio: Municipio[];
}