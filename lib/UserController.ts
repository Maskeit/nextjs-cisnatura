import { api } from './api';
import type {
  UserProfileResponse,
  UserProfileSummaryResponse,
  UserUpdateProfile,
  UserChangePassword,
  UserChangePasswordResponse,
  UserDeleteResponse,
  UserAdminListResponse,
  UserAdminListParams,
  UserAdminDetailsResponse,
  UserAdminUpdate,
  UserBanRequest,
  UserBanResponse,
  UserUnbanResponse,
  UserStatsResponse,
} from '@/interfaces/User';

/**
 * UserController - Gestión de perfiles de usuario y administración
 * 
 * Métodos de Usuario:
 * - getMyProfile: Obtener perfil propio
 * - getMyProfileSummary: Obtener perfil con estadísticas
 * - updateMyProfile: Actualizar perfil propio
 * - changePassword: Cambiar contraseña
 * - deleteMyAccount: Eliminar/desactivar cuenta propia
 * 
 * Métodos de Administración:
 * - getUsers: Listar todos los usuarios (con filtros)
 * - getUserById: Obtener detalles de un usuario
 * - updateUser: Actualizar usuario
 * - banUser: Banear usuario
 * - unbanUser: Desbanear usuario
 * - deleteUser: Eliminar usuario permanentemente
 * - getUserStats: Obtener estadísticas de usuarios
 */

// ==================== MÉTODOS DE USUARIO ====================

/**
 * Obtener perfil del usuario actual
 * GET /users/me
 * 
 * @returns Perfil del usuario autenticado
 * @throws Error si no está autenticado o hay error del servidor
 */
export const getMyProfile = async (): Promise<UserProfileResponse> => {
  const response = await api.get<UserProfileResponse>('/users/me');
  return response.data;
};

/**
 * Obtener resumen completo del perfil con estadísticas
 * GET /users/me/summary
 * 
 * Incluye:
 * - Información del perfil
 * - Total de órdenes (completadas, pendientes)
 * - Total gastado
 * - Direcciones guardadas
 * - Última orden
 * 
 * @returns Resumen completo del perfil con estadísticas
 */
export const getMyProfileSummary = async (): Promise<UserProfileSummaryResponse> => {
  const response = await api.get<UserProfileSummaryResponse>('/users/me/summary');
  return response.data;
};

/**
 * Actualizar perfil del usuario actual
 * PUT /users/me
 * 
 * @param data - Datos a actualizar (solo full_name por ahora)
 * @returns Perfil actualizado
 * 
 * @example
 * await updateMyProfile({ full_name: "Juan Carlos Pérez" });
 */
export const updateMyProfile = async (
  data: UserUpdateProfile
): Promise<UserProfileResponse> => {
  const response = await api.put<UserProfileResponse>('/users/me', data);
  return response.data;
};

/**
 * Cambiar contraseña del usuario actual
 * POST /users/me/change-password
 * 
 * Validaciones:
 * - Contraseña actual debe ser correcta
 * - Nueva contraseña mínimo 8 caracteres
 * - Nueva contraseña diferente a la actual
 * - Confirmación debe coincidir
 * 
 * @param data - Contraseña actual, nueva y confirmación
 * @returns Confirmación del cambio
 * @throws Error con código INVALID_PASSWORD si la contraseña actual es incorrecta
 * 
 * @example
 * await changePassword({
 *   current_password: "OldPassword123!",
 *   new_password: "NewPassword456!",
 *   confirm_password: "NewPassword456!"
 * });
 */
export const changePassword = async (
  data: UserChangePassword
): Promise<UserChangePasswordResponse> => {
  const response = await api.post<UserChangePasswordResponse>(
    '/users/me/change-password',
    data
  );
  return response.data;
};

/**
 * Eliminar/desactivar cuenta propia (soft delete)
 * DELETE /users/me
 * 
 * Restricciones:
 * - No se puede eliminar si hay órdenes pendientes
 * - La cuenta se desactiva, no se elimina permanentemente
 * - Un administrador puede reactivarla después
 * 
 * @returns Confirmación de desactivación
 * @throws Error con código PENDING_ORDERS si hay órdenes pendientes
 * 
 * @example
 * await deleteMyAccount();
 */
export const deleteMyAccount = async (): Promise<UserDeleteResponse> => {
  const response = await api.delete<UserDeleteResponse>('/users/me');
  return response.data;
};

// ==================== MÉTODOS DE ADMINISTRACIÓN ====================

/**
 * Listar todos los usuarios (solo administradores)
 * GET /users/admin/users
 * 
 * Soporta paginación y múltiples filtros:
 * - search: Buscar por email o nombre
 * - is_active: Filtrar por estado activo
 * - is_admin: Filtrar por rol admin
 * - email_verified: Filtrar por email verificado
 * - created_from/created_to: Filtrar por fecha de registro
 * 
 * @param params - Parámetros de filtrado y paginación
 * @returns Lista paginada de usuarios con estadísticas
 * 
 * @example
 * // Usuarios activos, página 1
 * await getUsers({ page: 1, limit: 20, is_active: true });
 * 
 * @example
 * // Buscar usuarios no verificados
 * await getUsers({ email_verified: false });
 * 
 * @example
 * // Usuarios registrados este mes
 * await getUsers({ created_from: "2025-11-01T00:00:00Z" });
 */
export const getUsers = async (
  params?: UserAdminListParams
): Promise<UserAdminListResponse> => {
  const response = await api.get<UserAdminListResponse>('/users/admin/users', {
    params,
  });
  return response.data;
};

/**
 * Obtener detalles completos de un usuario (solo administradores)
 * GET /users/admin/users/{user_id}
 * 
 * Incluye:
 * - Información completa del perfil
 * - Estadísticas de órdenes y gastos
 * - Últimas 5 órdenes
 * 
 * @param userId - ID del usuario
 * @returns Detalles completos del usuario
 * 
 * @example
 * await getUserById("uuid-here");
 */
export const getUserById = async (userId: string): Promise<UserAdminDetailsResponse> => {
  const response = await api.get<UserAdminDetailsResponse>(
    `/users/admin/users/${userId}`
  );
  return response.data;
};

/**
 * Actualizar información de un usuario (solo administradores)
 * PATCH /users/admin/users/{user_id}
 * 
 * Puede actualizar:
 * - full_name: Nombre completo
 * - is_active: Activar/desactivar usuario
 * - is_admin: Otorgar/quitar permisos de administrador
 * - email_verified: Marcar email como verificado
 * 
 * Restricciones:
 * - No puedes quitarte tus propios permisos de admin
 * 
 * @param userId - ID del usuario a actualizar
 * @param data - Campos a actualizar (todos opcionales)
 * @returns Usuario actualizado
 * @throws Error con código CANNOT_DEMOTE_SELF si intentas quitarte admin
 * 
 * @example
 * // Verificar email manualmente
 * await updateUser("uuid", { email_verified: true });
 * 
 * @example
 * // Promover a administrador
 * await updateUser("uuid", { is_admin: true });
 * 
 * @example
 * // Desactivar usuario
 * await updateUser("uuid", { is_active: false });
 */
export const updateUser = async (
  userId: string,
  data: UserAdminUpdate
): Promise<UserAdminDetailsResponse> => {
  const response = await api.patch<UserAdminDetailsResponse>(
    `/users/admin/users/${userId}`,
    data
  );
  return response.data;
};

/**
 * Banear usuario (desactivar cuenta) (solo administradores)
 * POST /users/admin/users/{user_id}/ban
 * 
 * Restricciones:
 * - No puedes banear a otros administradores
 * - No puedes banearte a ti mismo
 * - La razón es opcional
 * 
 * @param userId - ID del usuario a banear
 * @param data - Razón del baneo (opcional)
 * @returns Confirmación con detalles del baneo
 * @throws Error con código CANNOT_BAN_ADMIN si intentas banear un admin
 * 
 * @example
 * await banUser("uuid", { reason: "Violación de términos" });
 * 
 * @example
 * // Banear sin razón específica
 * await banUser("uuid");
 */
export const banUser = async (
  userId: string,
  data?: UserBanRequest
): Promise<UserBanResponse> => {
  const response = await api.post<UserBanResponse>(
    `/users/admin/users/${userId}/ban`,
    data || {}
  );
  return response.data;
};

/**
 * Desbanear usuario (reactivar cuenta) (solo administradores)
 * POST /users/admin/users/{user_id}/unban
 * 
 * @param userId - ID del usuario a desbanear
 * @returns Confirmación con usuario reactivado
 * 
 * @example
 * await unbanUser("uuid");
 */
export const unbanUser = async (userId: string): Promise<UserUnbanResponse> => {
  const response = await api.post<UserUnbanResponse>(
    `/users/admin/users/${userId}/unban`
  );
  return response.data;
};

/**
 * Eliminar usuario permanentemente (solo administradores)
 * DELETE /users/admin/users/{user_id}
 * 
 * ⚠️ PRECAUCIÓN: Esta acción es IRREVERSIBLE
 * 
 * Restricciones:
 * - No puedes eliminar administradores
 * - No puedes eliminarte a ti mismo
 * - Se recomienda usar ban/unban en su lugar
 * 
 * @param userId - ID del usuario a eliminar
 * @returns Confirmación de eliminación
 * @throws Error con código CANNOT_DELETE_ADMIN si intentas eliminar un admin
 * 
 * @example
 * await deleteUser("uuid");
 */
export const deleteUser = async (userId: string): Promise<UserDeleteResponse> => {
  const response = await api.delete<UserDeleteResponse>(
    `/users/admin/users/${userId}`
  );
  return response.data;
};

/**
 * Obtener estadísticas generales de usuarios (solo administradores)
 * GET /users/admin/stats
 * 
 * Retorna:
 * - Total de usuarios (activos, inactivos, admins)
 * - Usuarios verificados vs no verificados
 * - Nuevos usuarios (hoy, esta semana, este mes)
 * - Top 5 compradores (por total gastado)
 * 
 * @returns Estadísticas completas del sistema de usuarios
 * 
 * @example
 * const stats = await getUserStats();
 */
export const getUserStats = async (): Promise<UserStatsResponse> => {
  const response = await api.get<UserStatsResponse>('/users/admin/stats');
  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Formatea el nombre completo del usuario
 * @param fullName - Nombre completo
 * @returns Nombre formateado con primera letra en mayúscula
 */
export const formatUserName = (fullName: string): string => {
  return fullName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Verifica si un usuario está verificado
 * @param user - Usuario a verificar
 * @returns true si el email está verificado
 */
export const isUserVerified = (user: { email_verified: boolean }): boolean => {
  return user.email_verified;
};

/**
 * Verifica si un usuario es administrador
 * @param user - Usuario a verificar
 * @returns true si es administrador
 */
export const isUserAdmin = (user: { is_admin: boolean }): boolean => {
  return user.is_admin;
};

/**
 * Verifica si un usuario está activo
 * @param user - Usuario a verificar
 * @returns true si está activo
 */
export const isUserActive = (user: { is_active: boolean }): boolean => {
  return user.is_active;
};

/**
 * Formatea el total gastado como moneda MXN
 * @param amount - Cantidad en número
 * @returns String formateado como $X,XXX.XX MXN
 */
export const formatTotalSpent = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

/**
 * Formatea la fecha de creación/actualización
 * @param dateString - Fecha en formato ISO
 * @returns Fecha formateada en español
 */
export const formatUserDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

/**
 * Obtiene el badge apropiado para el estado del usuario
 * @param isActive - Si el usuario está activo
 * @returns Variant del badge para shadcn/ui
 */
export const getUserStatusBadgeVariant = (
  isActive: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  return isActive ? 'default' : 'destructive';
};

/**
 * Obtiene el label del estado del usuario
 * @param isActive - Si el usuario está activo
 * @returns Label en español
 */
export const getUserStatusLabel = (isActive: boolean): string => {
  return isActive ? 'Activo' : 'Inactivo';
};

/**
 * Obtiene el badge apropiado para la verificación de email
 * @param isVerified - Si el email está verificado
 * @returns Variant del badge para shadcn/ui
 */
export const getVerifiedBadgeVariant = (
  isVerified: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  return isVerified ? 'default' : 'outline';
};

/**
 * Obtiene el label de verificación de email
 * @param isVerified - Si el email está verificado
 * @returns Label en español
 */
export const getVerifiedLabel = (isVerified: boolean): string => {
  return isVerified ? 'Verificado' : 'No verificado';
};

/**
 * Obtiene el badge apropiado para el rol del usuario
 * @param isAdmin - Si es administrador
 * @returns Variant del badge para shadcn/ui
 */
export const getRoleBadgeVariant = (
  isAdmin: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  return isAdmin ? 'destructive' : 'secondary';
};

/**
 * Obtiene el label del rol del usuario
 * @param isAdmin - Si es administrador
 * @returns Label en español
 */
export const getRoleLabel = (isAdmin: boolean): string => {
  return isAdmin ? 'Administrador' : 'Usuario';
};

export default {
  // User methods
  getMyProfile,
  getMyProfileSummary,
  updateMyProfile,
  changePassword,
  deleteMyAccount,
  
  // Admin methods
  getUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  deleteUser,
  getUserStats,
  
  // Helpers
  formatUserName,
  isUserVerified,
  isUserAdmin,
  isUserActive,
  formatTotalSpent,
  formatUserDate,
  getUserStatusBadgeVariant,
  getUserStatusLabel,
  getVerifiedBadgeVariant,
  getVerifiedLabel,
  getRoleBadgeVariant,
  getRoleLabel,
};
