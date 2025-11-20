"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserController from '@/lib/UserController';
import type { UserAdminListItem, UserAdminListParams } from '@/interfaces/User';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface UsersTableProps {
  initialPage?: number;
  initialLimit?: number;
}

export default function UsersTable({ initialPage = 1, initialLimit = 20 }: UsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserAdminListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  
  // Diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    isDestructive?: boolean;
    isLoading?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {},
    isDestructive: false,
    isLoading: false,
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, limit, searchTerm, statusFilter, roleFilter, verifiedFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params: UserAdminListParams = {
        page: currentPage,
        limit: limit,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active';
      if (roleFilter !== 'all') params.is_admin = roleFilter === 'admin';
      if (verifiedFilter !== 'all') params.email_verified = verifiedFilter === 'verified';

      const response = await UserController.getUsers(params);
      
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.total_pages);
      setTotalUsers(response.data.pagination.total);
      setHasNext(response.data.pagination.has_next);
      setHasPrev(response.data.pagination.has_prev);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      
      if (error.response?.status === 401) {
        toast.error('Sesión expirada');
        router.push('/login');
      } else if (error.response?.status === 403) {
        toast.error('No tienes permisos para ver esta información');
      } else {
        toast.error('Error al cargar usuarios');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
    toast.success('Lista actualizada');
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
    setVerifiedFilter('all');
    setCurrentPage(1);
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleToggleActive = async (user: UserAdminListItem) => {
    const newStatus = !user.is_active;
    
    setConfirmDialog({
      open: true,
      title: newStatus ? '¿Activar usuario?' : '¿Desactivar usuario?',
      description: newStatus
        ? `¿Estás seguro de que deseas activar a ${user.full_name}? Podrá iniciar sesión nuevamente.`
        : `¿Estás seguro de que deseas desactivar a ${user.full_name}? No podrá iniciar sesión.`,
      action: async () => {
        try {
          await UserController.updateUser(user.id, { is_active: newStatus });
          toast.success(newStatus ? 'Usuario activado' : 'Usuario desactivado');
          await loadUsers();
        } catch (error: any) {
          if (error.response?.data?.error === 'CANNOT_DEMOTE_SELF') {
            toast.error('No puedes desactivarte a ti mismo');
          } else {
            toast.error('Error al actualizar usuario');
          }
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
        }
      },
      isDestructive: !newStatus,
    });
  };

  const handleToggleAdmin = async (user: UserAdminListItem) => {
    const newRole = !user.is_admin;
    
    setConfirmDialog({
      open: true,
      title: newRole ? '¿Promover a administrador?' : '¿Quitar permisos de administrador?',
      description: newRole
        ? `¿Estás seguro de que deseas dar permisos de administrador a ${user.full_name}?`
        : `¿Estás seguro de que deseas quitar los permisos de administrador a ${user.full_name}?`,
      action: async () => {
        try {
          await UserController.updateUser(user.id, { is_admin: newRole });
          toast.success(newRole ? 'Usuario promovido a administrador' : 'Permisos de administrador removidos');
          await loadUsers();
        } catch (error: any) {
          if (error.response?.data?.error === 'CANNOT_DEMOTE_SELF') {
            toast.error('No puedes quitarte tus propios permisos de administrador');
          } else {
            toast.error('Error al actualizar usuario');
          }
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
        }
      },
      isDestructive: !newRole,
    });
  };

  const handleVerifyEmail = async (user: UserAdminListItem) => {
    if (user.email_verified) {
      toast.info('El email ya está verificado');
      return;
    }

    try {
      await UserController.updateUser(user.id, { email_verified: true });
      toast.success('Email verificado manualmente');
      await loadUsers();
    } catch (error: any) {
      toast.error('Error al verificar email');
    }
  };

  const handleDeleteUser = async (user: UserAdminListItem) => {
    setConfirmDialog({
      open: true,
      title: '⚠️ ¿Eliminar usuario permanentemente?',
      description: `Esta acción es IRREVERSIBLE. ¿Estás seguro de que deseas eliminar permanentemente a ${user.full_name}? Se recomienda desactivar en su lugar.`,
      action: async () => {
        try {
          await UserController.deleteUser(user.id);
          toast.success('Usuario eliminado permanentemente');
          await loadUsers();
        } catch (error: any) {
          if (error.response?.data?.error === 'CANNOT_DELETE_ADMIN') {
            toast.error('No puedes eliminar administradores');
          } else if (error.response?.data?.error === 'CANNOT_DELETE_SELF') {
            toast.error('No puedes eliminarte a ti mismo');
          } else {
            toast.error('Error al eliminar usuario');
          }
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
        }
      },
      isDestructive: true,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Búsqueda */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>
                Buscar
              </Button>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="user">Usuarios</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Verificación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="unverified">No Verificados</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de resultados */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Mostrando {users.length} de {totalUsers} usuarios
        </p>
        <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="20">20 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
            <SelectItem value="100">100 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead className="text-right">Órdenes</TableHead>
                <TableHead className="text-right">Total Gastado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton Loading
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                // Empty State
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <XCircle className="h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium">No se encontraron usuarios</p>
                      <p className="text-sm text-muted-foreground">
                        Intenta con otros filtros o términos de búsqueda
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data Rows
                users.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {UserController.formatUserName(user.full_name)}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={UserController.getUserStatusBadgeVariant(user.is_active)}>
                        {UserController.getUserStatusLabel(user.is_active)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={UserController.getRoleBadgeVariant(user.is_admin)}>
                        {UserController.getRoleLabel(user.is_admin)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={UserController.getVerifiedBadgeVariant(user.email_verified)}>
                        {user.email_verified ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {UserController.getVerifiedLabel(user.email_verified)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{user.total_orders}</TableCell>
                    <TableCell className="text-right">
                      {UserController.formatTotalSpent(user.total_spent)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            {user.is_active ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                            {user.is_admin ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Quitar Admin
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Hacer Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          {!user.email_verified && (
                            <DropdownMenuItem onClick={() => handleVerifyEmail(user)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verificar Email
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Permanentemente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!hasPrev || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasNext || isLoading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Diálogo de Confirmación */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              disabled={confirmDialog.isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmDialog.isDestructive ? 'destructive' : 'default'}
              onClick={() => {
                setConfirmDialog(prev => ({ ...prev, isLoading: true }));
                confirmDialog.action();
              }}
              disabled={confirmDialog.isLoading}
            >
              {confirmDialog.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
