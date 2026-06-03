import { api } from "@/lib/api";
import type {
  CartResponse,
  CartSummaryResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
  CartItemType,
  ShippingInfoResponse,
  ShippingCalculationResponse,
} from "@/interfaces/Cart";

class CartController {
  /**
   * Obtener el carrito completo del usuario
   * @returns Promise con el carrito y todos sus items
   */
  static getCart = async (): Promise<CartResponse> => {
    const response = await api.get("/cart");
    return response.data;
  };

  /**
   * Obtener resumen del carrito (solo totales)
   * @returns Promise con el resumen del carrito
   */
  static getSummary = async (): Promise<CartSummaryResponse> => {
    const response = await api.get("/cart/summary");
    return response.data;
  };

  /**
   * Agregar un producto al carrito
   * @param data - Datos del producto a agregar (product_id y quantity)
   * @returns Promise con el carrito actualizado
   */
  static addItem = async (data: AddToCartRequest): Promise<CartResponse> => {
    const response = await api.post("/cart/items", data);
    return response.data;
  };

  /**
   * Actualizar la cantidad de un item en el carrito
   * @param itemId - ID del producto o protocolo en el carrito
   * @param data - Nueva cantidad
   * @param itemType - Tipo de item ('product' por defecto, 'protocol' para protocolos)
   * @returns Promise con el carrito actualizado
   */
  static updateItem = async (
    itemId: number,
    data: UpdateCartItemRequest,
    itemType: CartItemType = "product"
  ): Promise<CartResponse> => {
    const response = await api.put(`/cart/items/${itemId}`, data, {
      params: { item_type: itemType },
    });
    return response.data;
  };

  /**
   * Eliminar un item del carrito (genérico)
   * @param itemId - ID del producto o protocolo a eliminar
   * @param itemType - Tipo de item ('product' por defecto, 'protocol' para protocolos)
   * @returns Promise con el carrito actualizado
   */
  static removeItem = async (
    itemId: number,
    itemType: CartItemType = "product"
  ): Promise<CartResponse> => {
    const response = await api.delete(`/cart/items/${itemId}`, {
      params: { item_type: itemType },
    });
    return response.data;
  };

  /**
   * Eliminar un producto del carrito
   * @param productId - ID del producto a eliminar
   * @returns Promise con el carrito actualizado
   */
  static removeProduct = async (productId: number): Promise<CartResponse> => {
    return this.removeItem(productId, "product");
  };

  /**
   * Eliminar un protocolo del carrito
   * @param protocolId - ID del protocolo a eliminar
   * @returns Promise con el carrito actualizado
   */
  static removeProtocol = async (protocolId: number): Promise<CartResponse> => {
    return this.removeItem(protocolId, "protocol");
  };

  /**
   * Eliminar un item del carrito por su tipo e IDs
   * @param itemType - Tipo de item ('product' o 'protocol')
   * @param productId - ID del producto (si itemType es 'product')
   * @param protocolId - ID del protocolo (si itemType es 'protocol')
   * @returns Promise con el carrito actualizado
   */
  static removeItemByType = async (
    itemType: CartItemType,
    productId?: number,
    protocolId?: number
  ): Promise<CartResponse> => {
    if (itemType === 'protocol' && protocolId) {
      return this.removeProtocol(protocolId);
    } else if (itemType === 'product' && productId) {
      return this.removeProduct(productId);
    }
    throw new Error('ID inválido para el tipo de item');
  };

  /**
   * Vaciar todo el carrito
   * @returns Promise con el carrito vacío
   */
  static clearCart = async (): Promise<CartResponse> => {
    const response = await api.delete("/cart/clear");
    return response.data;
  };

  /**
   * Incrementar la cantidad de un item en 1
   * @param productId - ID del producto
   * @param currentQuantity - Cantidad actual
   * @returns Promise con el carrito actualizado
   */
  static incrementItem = async (
    productId: number,
    currentQuantity: number
  ): Promise<CartResponse> => {
    return this.updateItem(productId, { quantity: currentQuantity + 1 });
  };

  /**
   * Decrementar la cantidad de un item en 1
   * @param productId - ID del producto
   * @param currentQuantity - Cantidad actual
   * @returns Promise con el carrito actualizado
   */
  static decrementItem = async (
    productId: number,
    currentQuantity: number
  ): Promise<CartResponse> => {
    const newQuantity = currentQuantity - 1;
    
    // Si la cantidad llega a 0, eliminar el item
    if (newQuantity <= 0) {
      return this.removeItem(productId);
    }
    
    return this.updateItem(productId, { quantity: newQuantity });
  };

  /**
   * Obtener información de envío (público)
   * @returns Promise con la información de precios de envío
   */
  static getShippingInfo = async (): Promise<ShippingInfoResponse> => {
    const response = await api.get("/settings/shipping/info");
    return response.data;
  };

  /**
   * Calcular el costo de envío basado en el total del pedido
   * @param total - Total del pedido
   * @returns Promise con el cálculo de envío
   */
  static calculateShipping = async (
    total: number
  ): Promise<ShippingCalculationResponse> => {
    const response = await api.get(`/settings/shipping/calculate?total=${total}`);
    return response.data;
  };
}

export default CartController;
