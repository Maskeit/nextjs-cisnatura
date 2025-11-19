import axios, { AxiosError } from "axios";
import type { ApiErrorResponseWrapper } from "@/interfaces/User";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para manejar errores y extraer el contenido de 'detail'
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponseWrapper>) => {
    // Si la respuesta tiene la estructura { detail: { ... } }, extraer el detail
    if (error.response?.data?.detail) {
      // Reemplazar error.response.data con el contenido de detail
      error.response.data = error.response.data.detail as any;
    }
    return Promise.reject(error);
  }
);