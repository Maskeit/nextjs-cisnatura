import { api } from "@/lib/api";
import { 
  ProductsResponse, 
  AdminListProductsParams,
  AdminListProductsResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  DeleteProductResponse
} from "@/interfaces/Products";

interface ProductFilters {
  page?: number;
  limit?: number;
  category_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
}

class ProductController {
  /**
   * Obtener productos con filtros y paginación
   * @param filters - Filtros opcionales para la consulta
   * @returns Promise con la respuesta de productos
   */
  static fetchProducts = async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    const {
      page = 1,
      limit = 20,
      category_id,
      search,
      min_price,
      max_price,
    } = filters;

    // Construir parámetros, solo incluir los que tienen valor
    const params: Record<string, string | number> = {
      page,
      limit,
    };

    if (category_id !== undefined) {
      params.category_id = category_id;
    }

    if (search) {
      params.search = search.trim();
    }

    if (min_price !== undefined && min_price >= 0) {
      params.min_price = min_price;
    }

    if (max_price !== undefined && max_price >= 0) {
      params.max_price = max_price;
    }

    const response = await api.get("products", { params });
    return response.data;
  };

  /**
   * Buscar productos por nombre
   * @param searchTerm - Término de búsqueda
   * @param page - Número de página
   * @param limit - Productos por página
   */
  static searchProducts = async (
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ProductsResponse> => {
    return this.fetchProducts({ search: searchTerm, page, limit });
  };

  /**
   * Obtener productos por categoría
   * @param categoryId - ID de la categoría
   * @param page - Número de página
   * @param limit - Productos por página
   */
  static getProductsByCategory = async (
    categoryId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<ProductsResponse> => {
    return this.fetchProducts({ category_id: categoryId, page, limit });
  };

  /**
   * Obtener productos por rango de precio
   * @param minPrice - Precio mínimo
   * @param maxPrice - Precio máximo
   * @param page - Número de página
   * @param limit - Productos por página
   */
  static getProductsByPriceRange = async (
    minPrice: number,
    maxPrice: number,
    page: number = 1,
    limit: number = 20
  ): Promise<ProductsResponse> => {
    return this.fetchProducts({ min_price: minPrice, max_price: maxPrice, page, limit });
  };

  // ==================== ADMIN METHODS ====================

  /**
   * Listar todos los productos (admin) - incluye productos inactivos
   * @param params - Parámetros de filtrado y paginación
   * @returns Promise con la respuesta de productos de admin
   */
  static adminListAll = async (params: AdminListProductsParams = {}): Promise<AdminListProductsResponse> => {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.category_id !== undefined) queryParams.category_id = params.category_id;
    if (params.search) queryParams.search = params.search.trim();
    if (params.min_price !== undefined) queryParams.min_price = params.min_price;
    if (params.max_price !== undefined) queryParams.max_price = params.max_price;
    if (params.is_active !== undefined) queryParams.is_active = params.is_active;

    const response = await api.get("/products/admin/all", { params: queryParams });
    return response.data;
  };

  /**
   * Crear un nuevo producto (admin)
   * @param data - Datos del producto a crear
   * @returns Promise con la respuesta del producto creado
   */
  static adminCreate = async (data: CreateProductRequest): Promise<CreateProductResponse> => {
    const response = await api.post("/products", data);
    return response.data;
  };

  /**
   * Actualizar un producto existente (admin)
   * @param productId - ID del producto a actualizar
   * @param data - Datos a actualizar
   * @returns Promise con la respuesta del producto actualizado
   */
  static adminUpdate = async (
    productId: number, 
    data: UpdateProductRequest
  ): Promise<UpdateProductResponse> => {
    const response = await api.put(`/products/${productId}`, data);
    return response.data;
  };

  /**
   * Eliminar un producto (admin) - soft delete
   * @param productId - ID del producto a eliminar
   * @returns Promise con la respuesta de eliminación
   */
  static adminDelete = async (productId: number): Promise<DeleteProductResponse> => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  };
}

export default ProductController;