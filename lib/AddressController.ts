import { api } from "@/lib/api";
import type {
  AddressResponse,
  AddressListResponse,
  AddressDeleteResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@/interfaces/Address";

class AddressController {
  /**
   * Obtener todas las direcciones del usuario
   * @returns Promise con la lista de direcciones, total y límite máximo
   */
  static getAddresses = async (): Promise<AddressListResponse> => {
    const response = await api.get("/addresses");
    return response.data;
  };

  /**
   * Obtener una dirección específica por ID
   * @param addressId - ID de la dirección
   * @returns Promise con la dirección solicitada
   */
  static getAddressById = async (
    addressId: number
  ): Promise<AddressResponse> => {
    const response = await api.get(`/addresses/${addressId}`);
    return response.data;
  };

  /**
   * Crear una nueva dirección
   * @param data - Datos de la dirección a crear
   * @returns Promise con la dirección creada
   */
  static createAddress = async (
    data: CreateAddressRequest
  ): Promise<AddressResponse> => {
    const response = await api.post("/addresses", data);
    return response.data;
  };

  /**
   * Actualizar una dirección existente
   * @param addressId - ID de la dirección a actualizar
   * @param data - Datos a actualizar (parcial)
   * @returns Promise con la dirección actualizada
   */
  static updateAddress = async (
    addressId: number,
    data: UpdateAddressRequest
  ): Promise<AddressResponse> => {
    const response = await api.put(`/addresses/${addressId}`, data);
    return response.data;
  };

  /**
   * Eliminar una dirección
   * @param addressId - ID de la dirección a eliminar
   * @returns Promise con confirmación de eliminación
   */
  static deleteAddress = async (
    addressId: number
  ): Promise<AddressDeleteResponse> => {
    const response = await api.delete(`/addresses/${addressId}`);
    return response.data;
  };

  /**
   * Marcar una dirección como predeterminada
   * @param addressId - ID de la dirección a marcar como predeterminada
   * @returns Promise con la dirección actualizada
   */
  static setDefaultAddress = async (
    addressId: number
  ): Promise<AddressResponse> => {
    const response = await api.patch(`/addresses/${addressId}/set-default`);
    return response.data;
  };

  /**
   * Obtener la dirección predeterminada del usuario
   * @returns Promise con la dirección predeterminada o null si no hay ninguna
   */
  static getDefaultAddress = async (): Promise<AddressResponse | null> => {
    try {
      const response = await this.getAddresses();
      if (response.success && response.data.addresses.length > 0) {
        // La dirección predeterminada siempre viene primera (ordenadas por is_default)
        const defaultAddress = response.data.addresses.find(
          (addr) => addr.is_default
        );
        if (defaultAddress) {
          return {
            success: true,
            status_code: 200,
            message: "Dirección predeterminada obtenida",
            data: defaultAddress,
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Error al obtener dirección predeterminada:", error);
      return null;
    }
  };
}

export default AddressController;
