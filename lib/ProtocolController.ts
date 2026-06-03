import { api } from "./api";
import {
  Protocol,
  ProtocolDetailed,
  ProtocolUserAccess,
  ProtocolProgress,
  ProtocolCreate,
  ProtocolUpdate,
  ProtocolPhaseUpdate,
  ProtocolProgressUpdate,
  GetProtocolsParams,
  AdminListProtocolsParams,
  AdminListProtocolsResponse,
  UploadProtocolFileResponse,
  ProtocolCategory,
  ProtocolPhaseCreate,
  ProtocolPublicListData,
  ProtocolPublicListResponse,
} from "@/interfaces/Protocol";

class ProtocolController {
  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Listar protocolos publicados (público)
   * @param params - Filtros opcionales: page, limit, difficulty, featured_only
   * @returns Promise con lista de protocolos
   */
  static fetchProtocols = async (
    params: GetProtocolsParams = {}
  ): Promise<ProtocolPublicListData> => {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.featured_only !== undefined) queryParams.featured_only = params.featured_only;
    if (params.category_id !== undefined) queryParams.category_id = params.category_id;
    if (params.search !== undefined && params.search !== "") queryParams.search = params.search;

    const response = await api.get<ProtocolPublicListResponse>("/protocols/", { params: queryParams });
    return response.data.data;
  };

  /**
   * Listar categorías de protocolos activas (público)
   * @returns Promise con lista de categorías
   */
  static fetchPublicCategories = async (): Promise<ProtocolCategory[]> => {
    const response = await api.get<{
      success: boolean;
      status_code: number;
      message: string;
      data: { categories: ProtocolCategory[] };
    }>("/protocols/categories");
    return response.data.data.categories;
  };

  /**
   * Obtener detalle público de un protocolo por slug
   * @param slug - Slug del protocolo
   * @returns Promise con protocolo detallado (sin contenido HTML privado)
   */
  static getBySlug = async (slug: string): Promise<ProtocolDetailed> => {
    const response = await api.get<ProtocolDetailed>(`/protocols/${slug}`);
    return response.data;
  };

  // ==================== USER ENDPOINTS ====================

  /**
   * Obtener protocolos comprados del usuario actual
   * @returns Promise con lista de accesos activos y progreso
   */
  static getMyProtocols = async (): Promise<ProtocolUserAccess[]> => {
    const response = await api.get<ProtocolUserAccess[]>("/protocols/my-protocols/");
    return response.data;
  };

  /**
   * Leer protocolo completo (solo si el usuario lo compró)
   * @param slug - Slug del protocolo
   * @returns Promise con protocolo completo incluyendo contenido HTML
   */
  static read = async (slug: string): Promise<ProtocolDetailed> => {
    const response = await api.get<ProtocolDetailed>(`/protocols/${slug}/read`);
    return response.data;
  };

  /**
   * Actualizar progreso del usuario en un protocolo
   * @param slug - Slug del protocolo
   * @param data - Fase actual y fases completadas
   * @returns Promise con el progreso actualizado
   */
  static updateProgress = async (
    slug: string,
    data: ProtocolProgressUpdate
  ): Promise<ProtocolProgress> => {
    const response = await api.put<ProtocolProgress>(
      `/protocols/${slug}/progress`,
      data
    );
    return response.data;
  };

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Listar todos los protocolos (admin) - incluye borradores
   * @param params - Parámetros de filtrado y paginación
   * @returns Promise con protocolos y paginación
   */
  static adminListAll = async (
    params: AdminListProtocolsParams = {}
  ): Promise<AdminListProtocolsResponse> => {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.featured_only !== undefined) queryParams.featured_only = params.featured_only;
    if (params.is_published !== undefined) queryParams.is_published = params.is_published;

    const response = await api.get<AdminListProtocolsResponse>("/protocols/admin/all", {
      params: queryParams,
    });
    return response.data;
  };

  /**
   * Crear nuevo protocolo (admin)
   * @param data - Datos del protocolo incluyendo fases opcionales
   * @returns Promise con el protocolo creado
   */
  static adminCreate = async (data: ProtocolCreate): Promise<Protocol> => {
    const response = await api.post<Protocol>("/protocols/admin/create", data);
    return response.data;
  };

  /**
   * Actualizar un protocolo existente (admin)
   * @param protocolId - ID del protocolo
   * @param data - Campos a actualizar (PATCH semántico)
   * @returns Promise con el protocolo actualizado
   */
  static adminUpdate = async (
    protocolId: number,
    data: ProtocolUpdate
  ): Promise<Protocol> => {
    const response = await api.put<Protocol>(
      `/protocols/admin/${protocolId}`,
      data
    );
    return response.data;
  };

  /**
   * Publicar un protocolo (admin)
   * @param protocolId - ID del protocolo
   * @returns Promise con resultado de la operación
   */
  static adminPublish = async (
    protocolId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put<{
      success: boolean;
      status_code: number;
      message: string;
      data: { protocol_id: number };
    }>(`/protocols/admin/${protocolId}/publish`);
    return { success: response.data.success, message: response.data.message };
  };

  /**
   * Despublicar un protocolo (admin)
   * @param protocolId - ID del protocolo
   * @returns Promise con resultado de la operación
   */
  static adminUnpublish = async (
    protocolId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put<{
      success: boolean;
      status_code: number;
      message: string;
      data: { protocol_id: number };
    }>(`/protocols/admin/${protocolId}/unpublish`);
    return { success: response.data.success, message: response.data.message };
  };

  /**
   * Eliminar un protocolo permanentemente (admin)
   * @param protocolId - ID del protocolo a eliminar
   * @returns Promise con resultado de la operación
   */
  static adminDelete = async (
    protocolId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{
      success: boolean;
      status_code: number;
      message: string;
    }>(`/protocols/admin/${protocolId}`);
    return { success: response.data.success, message: response.data.message };
  };

  /**
   * Crear una nueva fase en un protocolo existente (admin)
   * @param protocolId - ID del protocolo
   * @param data - Datos de la fase incluyendo recursos opcionales
   * @returns Promise con la fase creada
   */
  static adminCreatePhase = async (
    protocolId: number,
    data: ProtocolPhaseCreate
  ): Promise<{ success: boolean; status_code: number; message: string; data: any }> => {
    const response = await api.post<{
      success: boolean;
      status_code: number;
      message: string;
      data: any;
    }>(`/protocols/admin/${protocolId}/phases`, data);
    return response.data;
  };

  /**
   * Actualizar una fase de un protocolo (admin)
   * @param protocolId - ID del protocolo
   * @param phaseId - ID de la fase
   * @param data - Campos a actualizar
   * @returns Promise con la fase actualizada
   */
  static adminUpdatePhase = async (
    protocolId: number,
    phaseId: number,
    data: ProtocolPhaseUpdate
  ): Promise<{ success: boolean; status_code: number; message: string; data: any }> => {
    const response = await api.put<{
      success: boolean;
      status_code: number;
      message: string;
      data: any;
    }>(`/protocols/admin/${protocolId}/phases/${phaseId}`, data);
    return response.data;
  };

  /**
   * Eliminar una fase de un protocolo (admin)
   * @param protocolId - ID del protocolo
   * @param phaseId - ID de la fase a eliminar
   * @returns Promise con resultado de la operación
   */
  static adminDeletePhase = async (
    protocolId: number,
    phaseId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{
      success: boolean;
      status_code: number;
      message: string;
    }>(`/protocols/admin/${protocolId}/phases/${phaseId}`);
    return { success: response.data.success, message: response.data.message };
  };

  // ==================== ADMIN CATEGORY ENDPOINTS ====================

  /**
   * Listar todas las categorías de protocolos (admin)
   * @returns Promise con lista de categorías
   */
  static adminListCategories = async (): Promise<ProtocolCategory[]> => {
    const response = await api.get<{ success: boolean; status_code: number; message: string; data: { categories: ProtocolCategory[] } }>("/protocols/admin/categories");
    return response.data.data.categories;
  };

  /**
   * Obtener una categoría específica (admin)
   * @param categoryId - ID de la categoría
   * @returns Promise con los detalles de la categoría
   */
  static adminGetCategory = async (categoryId: number): Promise<ProtocolCategory> => {
    const response = await api.get<{ success: boolean; status_code: number; message: string; data: ProtocolCategory }>(`/protocols/admin/categories/${categoryId}`);
    return response.data.data;
  };

  /**
   * Crear una categoría para protocolos (admin)
   * @param name - nombre de la categoría
   * @param slug - url amigable de la categoría
   * @returns Promise con la categoría creada
   */
  static adminCreateProtocolCategory = async (
    name: string,
    slug: string,
  ): Promise<ProtocolCategory> => {
    const response = await api.post<{ success: boolean; status_code: number; message: string; data: ProtocolCategory }>("/protocols/admin/categories", {
      name,
      slug,
      is_active: true,
    });
    return response.data.data;
  };

  /**
   * Actualizar una categoría de protocolos (admin)
   * @param categoryId - ID de la categoría
   * @param data - Datos a actualizar (parciales)
   * @returns Promise con la categoría actualizada
   */
  static adminUpdateProtocolCategory = async (
    categoryId: number,
    data: {
      name?: string;
      slug?: string;
      is_active?: boolean;
    }
  ): Promise<ProtocolCategory> => {
    const response = await api.put<{ success: boolean; status_code: number; message: string; data: ProtocolCategory }>(`/protocols/admin/categories/${categoryId}`, data);
    return response.data.data;
  };

  /**
   * Eliminar una categoría de protocolos (admin)
   * @param categoryId - ID de la categoría
   * @returns Promise con resultado de la operación
   */
  static adminDeleteProtocolCategory = async (categoryId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; status_code: number; message: string }>(`/protocols/admin/categories/${categoryId}`);
    return { success: response.data.success, message: response.data.message };
  };

  // ==================== UPLOAD METHODS ====================

  /**
   * Subir imagen o PDF para protocolo (admin)
   * @param file - Archivo a subir (imagen máx 5MB, PDF máx 10MB)
   * @param onUploadProgress - Callback para progreso de subida
   * @returns Promise con URL del archivo subido
   */
  static uploadFile = async (
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<UploadProtocolFileResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/uploads/protocols", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return response.data;
  };

  // ==================== HELPERS ====================

  /**
   * Calcular porcentaje de progreso
   * @param completed - Fases completadas
   * @param total - Total de fases
   * @returns Porcentaje (0-100)
   */
  static getProgressPercent = (completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };


  /**
   * Formatear duración en horas/minutos
   * @param hours - Duración en horas
   * @returns String formateado
   */
  static formatDuration = (hours: number | null): string => {
    if (!hours) return "Sin duración estimada";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours}h`;
  };

  /**
   * Verificar si el usuario completó un protocolo
   * @param progress - Progreso del usuario
   * @returns true si completó todas las fases
   */
  static isCompleted = (progress: ProtocolProgress | null): boolean => {
    if (!progress) return false;
    return progress.completed_phases >= progress.total_phases && progress.total_phases > 0;
  };
}

export default ProtocolController;
