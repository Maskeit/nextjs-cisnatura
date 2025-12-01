import { api } from "@/lib/api";
import {
  AdminSettings,
  AdminSettingsResponse,
  AdminSettingsUpdateResponse,
  UpdateMaintenanceRequest,
  UpdateShippingRequest,
  UpdateGlobalDiscountRequest,
  AddCategoryDiscountRequest,
  AddProductDiscountRequest,
  CreateSeasonalOfferRequest,
  UpdateUserRegistrationRequest,
  UpdateMaxItemsRequest,
} from "@/interfaces/AdminConfig";

/**
 * Controlador para gestionar las configuraciones administrativas del sistema
 * Todos los endpoints requieren autenticación de administrador
 */
class AdminConfigController {
  private readonly BASE_PATH = "/admin/settings";

  /**
   * Obtener todas las configuraciones del sistema
   * @returns Promise con las configuraciones actuales
   */
  async getSettings(): Promise<AdminSettings> {
    const response = await api.get<AdminSettings>(this.BASE_PATH);
    return response.data;
  }

  // ==================== MODO MANTENIMIENTO ====================

  /**
   * Activar o desactivar el modo mantenimiento
   * @param data - Estado del modo mantenimiento y mensaje opcional
   * @returns Promise con las configuraciones actualizadas
   */
  async updateMaintenance(
    data: UpdateMaintenanceRequest
  ): Promise<AdminSettings> {
    const response = await api.put<AdminSettings>(
      `${this.BASE_PATH}/maintenance`,
      data
    );
    return response.data;
  }

  // ==================== ENVÍO ====================

  /**
   * Actualizar precio de envío y umbral para envío gratis
   * @param data - Precio de envío y umbral para envío gratis
   * @returns Promise con las configuraciones actualizadas
   */
  async updateShipping(data: UpdateShippingRequest): Promise<AdminSettings> {
    const response = await api.put<AdminSettings>(
      `${this.BASE_PATH}/shipping`,
      data
    );
    return response.data;
  }

  // ==================== DESCUENTOS ====================

  /**
   * Actualizar descuento global del sistema
   * @param data - Configuración del descuento global
   * @returns Promise con las configuraciones actualizadas
   */
  async updateGlobalDiscount(
    data: UpdateGlobalDiscountRequest
  ): Promise<AdminSettings> {
    const response = await api.put<AdminSettings>(
      `${this.BASE_PATH}/discount/global`,
      data
    );
    return response.data;
  }

  /**
   * Agregar o actualizar descuento para una categoría específica
   * @param data - ID de categoría, porcentaje y nombre del descuento
   * @returns Promise con las configuraciones actualizadas
   */
  async addCategoryDiscount(
    data: AddCategoryDiscountRequest
  ): Promise<AdminSettings> {
    const response = await api.post<AdminSettings>(
      `${this.BASE_PATH}/discount/category`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar descuento de una categoría
   * @param categoryId - ID de la categoría
   * @returns Promise con las configuraciones actualizadas
   */
  async removeCategoryDiscount(categoryId: string): Promise<AdminSettings> {
    const response = await api.delete<AdminSettings>(
      `${this.BASE_PATH}/discount/category/${categoryId}`
    );
    return response.data;
  }

  /**
   * Agregar o actualizar descuento para un producto específico
   * @param data - ID de producto, porcentaje y nombre del descuento
   * @returns Promise con las configuraciones actualizadas
   */
  async addProductDiscount(
    data: AddProductDiscountRequest
  ): Promise<AdminSettings> {
    const response = await api.post<AdminSettings>(
      `${this.BASE_PATH}/discount/product`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar descuento de un producto
   * @param productId - ID del producto
   * @returns Promise con las configuraciones actualizadas
   */
  async removeProductDiscount(productId: string): Promise<AdminSettings> {
    const response = await api.delete<AdminSettings>(
      `${this.BASE_PATH}/discount/product/${productId}`
    );
    return response.data;
  }

  // ==================== OFERTAS TEMPORALES ====================

  /**
   * Crear una oferta temporal (Black Friday, Navidad, etc.)
   * @param data - Configuración de la oferta temporal
   * @returns Promise con las configuraciones actualizadas
   */
  async createSeasonalOffer(
    data: CreateSeasonalOfferRequest
  ): Promise<AdminSettings> {
    const response = await api.post<AdminSettings>(
      `${this.BASE_PATH}/seasonal-offer`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar una oferta temporal por nombre
   * @param offerName - Nombre de la oferta a eliminar
   * @returns Promise con las configuraciones actualizadas
   */
  async removeSeasonalOffer(offerName: string): Promise<AdminSettings> {
    const response = await api.delete<AdminSettings>(
      `${this.BASE_PATH}/seasonal-offer/${encodeURIComponent(offerName)}`
    );
    return response.data;
  }

  // ==================== OTRAS CONFIGURACIONES ====================

  /**
   * Activar o desactivar el registro de nuevos usuarios
   * @param data - Estado del registro de usuarios
   * @returns Promise con las configuraciones actualizadas
   */
  async updateUserRegistration(
    data: UpdateUserRegistrationRequest
  ): Promise<AdminSettings> {
    const response = await api.put<AdminSettings>(
      `${this.BASE_PATH}/user-registration`,
      data
    );
    return response.data;
  }

  /**
   * Actualizar el límite máximo de items por orden
   * @param data - Límite máximo de items
   * @returns Promise con las configuraciones actualizadas
   */
  async updateMaxItems(data: UpdateMaxItemsRequest): Promise<AdminSettings> {
    const response = await api.put<AdminSettings>(
      `${this.BASE_PATH}/max-items`,
      data
    );
    return response.data;
  }

  // ==================== HELPERS ====================

  /**
   * Verificar si el sistema está en modo mantenimiento
   * @returns Promise<boolean> - true si está en mantenimiento
   */
  async isMaintenanceMode(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.maintenance_mode;
  }

  /**
   * Calcular el costo de envío basado en el total de la orden
   * @param orderTotal - Total de la orden
   * @returns Promise con el costo de envío y si es gratis
   */
  async calculateShipping(orderTotal: number): Promise<{
    price: number;
    isFree: boolean;
    message: string;
    remainingForFreeShipping?: number;
  }> {
    const settings = await this.getSettings();

    if (
      settings.free_shipping_threshold &&
      orderTotal >= settings.free_shipping_threshold
    ) {
      return {
        price: 0,
        isFree: true,
        message: "¡Envío gratis!",
      };
    }

    const remaining = settings.free_shipping_threshold
      ? settings.free_shipping_threshold - orderTotal
      : undefined;

    return {
      price: settings.shipping_price,
      isFree: false,
      message: remaining
        ? `Agrega $${remaining.toFixed(2)} más para envío gratis`
        : `Envío: $${settings.shipping_price.toFixed(2)}`,
      remainingForFreeShipping: remaining,
    };
  }

  /**
   * Verificar si el registro de usuarios está habilitado
   * @returns Promise<boolean> - true si el registro está permitido
   */
  async isRegistrationAllowed(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.allow_user_registration;
  }
}

export default new AdminConfigController();