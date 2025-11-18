import { api } from "@/lib/api";
import type {
  CartResponse,
  CartSummaryResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
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
   * @param itemId - ID del item en el carrito
   * @param data - Nueva cantidad
   * @returns Promise con el carrito actualizado
   */
  static updateItem = async (
    itemId: number,
    data: UpdateCartItemRequest
  ): Promise<CartResponse> => {
    const response = await api.put(`/cart/items/${itemId}`, data);
    return response.data;
  };

  /**
   * Eliminar un item del carrito
   * @param itemId - ID del item a eliminar
   * @returns Promise con el carrito actualizado
   */
  static removeItem = async (itemId: number): Promise<CartResponse> => {
    const response = await api.delete(`/cart/items/${itemId}`);
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
   * @param itemId - ID del item
   * @param currentQuantity - Cantidad actual
   * @returns Promise con el carrito actualizado
   */
  static incrementItem = async (
    itemId: number,
    currentQuantity: number
  ): Promise<CartResponse> => {
    return this.updateItem(itemId, { quantity: currentQuantity + 1 });
  };

  /**
   * Decrementar la cantidad de un item en 1
   * @param itemId - ID del item
   * @param currentQuantity - Cantidad actual
   * @returns Promise con el carrito actualizado
   */
  static decrementItem = async (
    itemId: number,
    currentQuantity: number
  ): Promise<CartResponse> => {
    const newQuantity = currentQuantity - 1;
    
    // Si la cantidad llega a 0, eliminar el item
    if (newQuantity <= 0) {
      return this.removeItem(itemId);
    }
    
    return this.updateItem(itemId, { quantity: newQuantity });
  };
}

export default CartController;
