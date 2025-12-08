import { api } from "@/lib/api";
import {
  AdminSettings,
  UpdateMaintenanceRequest,
  UpdateShippingRequest,
  UpdateCategoriesNoShippingRequest,
  UpdateGlobalDiscountRequest,
  AddCategoryDiscountRequest,
  AddProductDiscountRequest,
  CreateSeasonalOfferRequest,
  UpdateUserRegistrationRequest,
  UpdateMaxItemsRequest,
  MaintenanceResponse,
  ShippingResponse,
  AllDiscountsResponse,
  GlobalDiscountResponse,
  CategoryDiscountsResponse,
  ProductDiscountsResponse,
  SeasonalOffersResponse,
  RegistrationResponse,
  //
  MaxItemsOperationResponse
} from "@/interfaces/AdminConfig";

import { ListCategoriesDrop, ListProductsDrop } from "@/interfaces/Products";

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

  // ==================== ENDPOINTS GET ESPECÍFICOS ====================

  /**
   * Obtener lista de categorias para dropdowns
   * @returns Promise con la lista de categorías
   */
  async getCategoriesForDrop(): Promise<ListCategoriesDrop['data']> {
    const response = await api.get<ListCategoriesDrop>(`/products/categories/admin/simple-list`, {
      params: { is_active: true },
    });
    return response.data.data;
  }

  /**
   * Obtener lista de productos para dropdowns
   * @returns Promise con la lista de productos
   */
  async getProductsForDrop(): Promise<ListProductsDrop['data']> {
    const response = await api.get<ListProductsDrop>(`/products/admin/simple-list`, {
      params: { is_active: true },
    });
    return response.data.data;
  }



  /**
   * Obtener solo configuración de mantenimiento
   * @returns Promise con la configuración de mantenimiento
   */
  async getMaintenance(): Promise<MaintenanceResponse['data']> {
    const response = await api.get<MaintenanceResponse>(`${this.BASE_PATH}/maintenance`);
    return response.data.data;
  }

  /**
   * Obtener solo configuración de envío
   * @returns Promise con la configuración de envío
   */
  async getShipping(): Promise<ShippingResponse['data']> {
    const response = await api.get<ShippingResponse>(`${this.BASE_PATH}/shipping`);
    return response.data.data;
  }

  /**
   * Obtener todos los descuentos (global + categorías + productos)
   * @returns Promise con todos los descuentos
   */
  async getAllDiscounts(): Promise<AllDiscountsResponse['data']> {
    const response = await api.get<AllDiscountsResponse>(`${this.BASE_PATH}/discounts`);
    return response.data.data;
  }

  /**
   * Obtener solo descuento global
   * @returns Promise con el descuento global
   */
  async getGlobalDiscount(): Promise<GlobalDiscountResponse['data']> {
    const response = await api.get<GlobalDiscountResponse>(`${this.BASE_PATH}/discount/global`);
    return response.data.data;
  }

  /**
   * Obtener solo descuentos por categoría
   * @returns Promise con los descuentos por categoría
   */
  async getCategoryDiscounts(): Promise<CategoryDiscountsResponse['data']> {
    const response = await api.get<CategoryDiscountsResponse>(`${this.BASE_PATH}/discount/categories`);
    return response.data.data;
  }

  /**
   * Obtener solo descuentos por producto
   * @returns Promise con los descuentos por producto
   */
  async getProductDiscounts(): Promise<ProductDiscountsResponse['data']> {
    const response = await api.get<ProductDiscountsResponse>(`${this.BASE_PATH}/discount/products`);
    return response.data.data;
  }

  /**
   * Obtener solo ofertas temporales
   * @returns Promise con las ofertas temporales
   */
  async getSeasonalOffers(): Promise<SeasonalOffersResponse['data']> {
    const response = await api.get<SeasonalOffersResponse>(`${this.BASE_PATH}/seasonal-offers`);
    return response.data.data;
  }

  /**
   * Obtener configuración de registro y límites
   * @returns Promise con la configuración de registro
   */
  async getRegistration(): Promise<RegistrationResponse['data']> {
    const response = await api.get<RegistrationResponse>(`${this.BASE_PATH}/registration`);
    return response.data.data;
  }

  // ==================== MODO MANTENIMIENTO ====================

  /**
   * Activar o desactivar el modo mantenimiento
   * @param data - Estado del modo mantenimiento y mensaje opcional
   * @returns Promise con la respuesta de mantenimiento actualizada
   */
  async updateMaintenance(
    data: UpdateMaintenanceRequest
  ): Promise<MaintenanceResponse> {
    const response = await api.put<MaintenanceResponse>(
      `${this.BASE_PATH}/maintenance`,
      data
    );
    return response.data;
  }

  // ==================== ENVÍO ====================

  /**
   * Actualizar precio de envío y umbral para envío gratis
   * @param data - Precio de envío y umbral para envío gratis
   * @returns Promise con la respuesta de envío actualizada
   */
  async updateShipping(data: UpdateShippingRequest): Promise<ShippingResponse> {
    const response = await api.put<ShippingResponse>(
      `${this.BASE_PATH}/shipping`,
      data
    );
    return response.data;
  }

  /**
   * Actualizar categorías que no pagan envío (productos digitales)
   * @param data - IDs de categorías sin costo de envío
   * @returns Promise con la respuesta de categorías actualizadas
   */
  async updateCategoriesNoShipping(
    data: UpdateCategoriesNoShippingRequest
  ): Promise<{ success: boolean; message: string; data: { categories_no_shipping: number[] } }> {
    const response = await api.put(
      `${this.BASE_PATH}/shipping/no-shipping-categories`,
      data
    );
    return response.data;
  }

  // ==================== DESCUENTOS ====================

  /**
   * Actualizar descuento global del sistema
   * @param data - Configuración del descuento global
   * @returns Promise con la respuesta de descuento global actualizada
   */
  async updateGlobalDiscount(
    data: UpdateGlobalDiscountRequest
  ): Promise<GlobalDiscountResponse> {
    const response = await api.put<GlobalDiscountResponse>(
      `${this.BASE_PATH}/discount/global`,
      data
    );
    return response.data;
  }

  /**
   * Agregar o actualizar descuento para una categoría específica
   * @param data - ID de categoría, porcentaje y nombre del descuento
   * @returns Promise con la respuesta de descuentos de categoría actualizados
   */
  async addCategoryDiscount(
    data: AddCategoryDiscountRequest
  ): Promise<CategoryDiscountsResponse> {
    const response = await api.post<CategoryDiscountsResponse>(
      `${this.BASE_PATH}/discount/category`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar descuento de una categoría
   * @param categoryId - ID de la categoría
   * @returns Promise con la respuesta de descuentos de categoría actualizados
   */
  async removeCategoryDiscount(categoryId: string): Promise<CategoryDiscountsResponse> {
    const response = await api.delete<CategoryDiscountsResponse>(
      `${this.BASE_PATH}/discount/category/${categoryId}`
    );
    return response.data;
  }

  /**
   * Agregar o actualizar descuento para un producto específico
   * @param data - ID de producto, porcentaje y nombre del descuento
   * @returns Promise con la respuesta de descuentos de producto actualizados
   */
  async addProductDiscount(
    data: AddProductDiscountRequest
  ): Promise<ProductDiscountsResponse> {
    const response = await api.post<ProductDiscountsResponse>(
      `${this.BASE_PATH}/discount/product`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar descuento de un producto
   * @param productId - ID del producto
   * @returns Promise con la respuesta de descuentos de producto actualizados
   */
  async removeProductDiscount(productId: string): Promise<ProductDiscountsResponse> {
    const response = await api.delete<ProductDiscountsResponse>(
      `${this.BASE_PATH}/discount/product/${productId}`
    );
    return response.data;
  }

  // ==================== OFERTAS TEMPORALES ====================

  /**
   * Crear una oferta temporal (Black Friday, Navidad, etc.)
   * @param data - Configuración de la oferta temporal
   * @returns Promise con la respuesta de ofertas temporales actualizadas
   */
  async createSeasonalOffer(
    data: CreateSeasonalOfferRequest
  ): Promise<SeasonalOffersResponse> {
    const response = await api.post<SeasonalOffersResponse>(
      `${this.BASE_PATH}/seasonal-offer`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar una oferta temporal por nombre
   * @param offerName - Nombre de la oferta a eliminar
   * @returns Promise con la respuesta de ofertas temporales actualizadas
   */
  async removeSeasonalOffer(offerName: string): Promise<SeasonalOffersResponse> {
    const response = await api.delete<SeasonalOffersResponse>(
      `${this.BASE_PATH}/seasonal-offer/${encodeURIComponent(offerName)}`
    );
    return response.data;
  }

  // ==================== OTRAS CONFIGURACIONES ====================

  /**
   * Activar o desactivar el registro de nuevos usuarios
   * @param data - Estado del registro de usuarios
   * @returns Promise con la respuesta de registro de usuarios actualizada
   */
  async updateUserRegistration(
    data: UpdateUserRegistrationRequest
  ): Promise<RegistrationResponse> {
    const response = await api.put<RegistrationResponse>(
      `${this.BASE_PATH}/user-registration`,
      data
    );
    return response.data;
  }

  /**
   * Actualizar el límite máximo de items por orden
   * @param data - Límite máximo de items
   * @returns Promise con la respuesta de límite máximo actualizada
   */
  async updateMaxItems(data: UpdateMaxItemsRequest): Promise<MaxItemsOperationResponse> {
    const response = await api.put<MaxItemsOperationResponse>(
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