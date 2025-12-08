import { api } from "@/lib/api";
import type {
  CartResponse,
  CartSummaryResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
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
    console.log('Cart summary response:', response.data.data.shipping_info);
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
   * @param productId - ID del producto en el carrito
   * @param data - Nueva cantidad
   * @returns Promise con el carrito actualizado
   */
  static updateItem = async (
    productId: number,
    data: UpdateCartItemRequest
  ): Promise<CartResponse> => {
    const response = await api.put(`/cart/items/${productId}`, data);
    return response.data;
  };

  /**
   * Eliminar un item del carrito
   * @param productId - ID del producto a eliminar
   * @returns Promise con el carrito actualizado
   */
  static removeItem = async (productId: number): Promise<CartResponse> => {
    const response = await api.delete(`/cart/items/${productId}`);
    return response.data;
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
