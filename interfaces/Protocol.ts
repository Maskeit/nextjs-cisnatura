// ==================== ENUMS ====================

export enum ResourceType {
  IMAGE = "image",
  PDF = "pdf",
  VIDEO = "video",
  LINK = "link",
  DOWNLOAD = "download",
}

// ==================== RESOURCE ====================
export interface ProtocolResource {
  id: number;
  resource_type: ResourceType;
  title: string;
  description: string | null;
  url: string;
  order: number;
  is_visible: boolean;
  created_at: string;
}

// ==================== PHASE ====================
export interface ProtocolPhase {
  id: number;
  protocol_id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string; // HTML
  order: number;
  duration_minutes: number | null;
  is_required: boolean;
  resources: ProtocolResource[];
  created_at: string;
  updated_at: string | null;
}

// ==================== CATEGORY ====================
export interface ProtocolCategory {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

// ==================== PROTOCOL (listing) ====================
export interface ProtocolListItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  author: string | null;
  category: ProtocolCategory;
  estimated_duration_hours: number | null;
  is_featured: boolean;
  total_phases: number;
  // Campos del producto vinculado
  price: number;
  image_url: string | null;
}

// ==================== PROTOCOL (full) ====================
export interface Protocol {
  id: number;
  name: string;
  slug: string;
  description: string;
  long_description: string | null;
  price: number;
  image_url: string | null;
  product_id: number;
  category_id: number;
  category: ProtocolCategory;
  author: string | null;
  version: string;
  estimated_duration_hours: number | null;
  is_featured: boolean;
  is_published: boolean;
  phases: ProtocolPhase[];
  associated_product_ids: number[];
  created_at: string;
  updated_at: string | null;
}

// ==================== PROTOCOL (detailed — with computed fields) ====================
export interface ProtocolDetailed extends Protocol {
  total_phases: number;
  total_duration_hours: number | null;
}

// ==================== PROGRESS ====================
export interface ProtocolProgress {
  id: number;
  protocol_id: number;
  user_id: string;
  current_phase_order: number;
  completed_phases: number;
  total_phases: number;
  started_at: string;
  completed_at: string | null;
  last_accessed_at: string | null;
}

// ==================== ACCESS ====================
export interface ProtocolAccess {
  id: number;
  protocol_id: number;
  user_id: string;
  order_id: number;
  order_item_id: number;
  is_active: boolean;
  access_until: string | null;
  granted_at: string;
  revoked_at: string | null;
}

// ==================== USER ACCESS (mis protocolos) ====================
export interface ProtocolUserAccess {
  protocol_id: number;
  protocol_name: string;
  protocol_slug: string;
  access_granted_at: string;
  access_until: string | null;
  current_progress: ProtocolProgress | null;
}

// ==================== API RESPONSES ====================
export interface ProtocolListResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ProtocolListItem[];
}

export interface ProtocolDetailedResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ProtocolDetailed;
}

export interface ProtocolResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Protocol;
}

export interface ProtocolUserAccessListResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ProtocolUserAccess[];
}

export interface ProtocolProgressResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ProtocolProgress;
}

// ==================== REQUEST BODIES ====================
export interface ProtocolResourceCreate {
  resource_type: ResourceType;
  title: string;
  description?: string;
  url: string;
  order: number;
  is_visible?: boolean;
}

export interface ProtocolPhaseCreate {
  title: string;
  slug: string;
  description?: string;
  content: string;
  order: number;
  duration_minutes?: number;
  is_required?: boolean;
  resources?: ProtocolResourceCreate[];
}

export interface ProtocolCreate {
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  price: number;
  image_url?: string;
  product_id: number;
  category_id: number;
  associated_product_ids?: number[];
  author?: string;
  version?: string;
  estimated_duration_hours?: number;
  is_featured?: boolean;
  phases?: ProtocolPhaseCreate[];
}

export interface ProtocolUpdate {
  name?: string;
  description?: string;
  long_description?: string;
  price?: number;
  image_url?: string;
  author?: string;
  category_id?: number;
  version?: string;
  estimated_duration_hours?: number;  
  is_featured?: boolean;
  is_published?: boolean;
  associated_product_ids?: number[];
}

export interface ProtocolPhaseUpdate {
  title?: string;
  content?: string;
  description?: string;
  duration_minutes?: number;
  is_required?: boolean;
  order?: number;
}

export interface ProtocolProgressUpdate {
  current_phase_order: number;
  completed_phases: number;
}

// ==================== PAGINATION ====================
export interface ProtocolPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ==================== ADMIN RESPONSES ====================
export interface AdminListProtocolsParams {
  page?: number;
  limit?: number;
  featured_only?: boolean;
  is_published?: boolean;
}

export interface AdminListProtocolsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    protocols: Protocol[];
    pagination: ProtocolPagination;
  };
}

export interface UploadProtocolFileResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    file_url: string;
    filename: string;
    content_type: string;
  };
}

// ==================== QUERY PARAMS ====================
export interface GetProtocolsParams {
  page?: number;
  limit?: number;
  featured_only?: boolean;
}

// ==================== ERRORS ====================
export type ProtocolErrorCode =
  | "PROTOCOL_NOT_FOUND"
  | "PROTOCOL_ACCESS_DENIED"
  | "PROTOCOL_ALREADY_PUBLISHED"
  | "PROTOCOL_NO_PHASES"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR";

export interface ProtocolApiError {
  success: false;
  status_code: number;
  message: string;
  error: ProtocolErrorCode;
}

export interface ProtocolApiErrorWrapper {
  detail: ProtocolApiError;
}