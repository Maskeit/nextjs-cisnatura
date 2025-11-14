import { api } from "@/lib/api";
import { ProductsResponse } from "@/interfaces/Products";

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
}

export default ProductController;