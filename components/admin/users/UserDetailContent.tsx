"use client"

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserController from '@/lib/UserController';
import { formatDate } from '@/lib/dateUtils';
import type { UserAdminDetails } from '@/interfaces/User';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  ShoppingBag,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  AlertTriangle,
  Loader2,
  Package,
} from 'lucide-react';

interface UserDetailContentProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailContent({ params }: UserDetailContentProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [userData, setUserData] = useState<UserAdminDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [resolvedParams.id]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const response = await UserController.getUserById(resolvedParams.id);
      setUserData(response.data);
    } catch (error: any) {
      console.error('Error al cargar usuario:', error);
      
      if (error.response?.status === 401) {
        toast.error('Sesión expirada');
        router.push('/login');
      } else if (error.response?.status === 403) {
        toast.error('No tienes permisos para ver esta información');
        router.push('/admin/users');
      } else if (error.response?.status === 404) {
        toast.error('Usuario no encontrado');
        router.push('/admin/users');
      } else {
        toast.error('Error al cargar usuario');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!userData) return;
    
    setIsUpdating(true);
    try {
      await UserController.updateUser(userData.id, { is_active: !userData.is_active });
      toast.success(userData.is_active ? 'Usuario desactivado' : 'Usuario activado');
      await loadUserData();
    } catch (error: any) {
      if (error.response?.data?.error === 'CANNOT_DEMOTE_SELF') {
        toast.error('No puedes desactivarte a ti mismo');
      } else {
        toast.error('Error al actualizar usuario');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAdmin = async () => {
    if (!userData) return;
    
    setIsUpdating(true);
    try {
      await UserController.updateUser(userData.id, { is_admin: !userData.is_admin });
      toast.success(userData.is_admin ? 'Permisos de administrador removidos' : 'Usuario promovido a administrador');
      await loadUserData();
    } catch (error: any) {
      if (error.response?.data?.error === 'CANNOT_DEMOTE_SELF') {
        toast.error('No puedes quitarte tus propios permisos de administrador');
      } else {
        toast.error('Error al actualizar usuario');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!userData || userData.email_verified) return;
    
    setIsUpdating(true);
    try {
      await UserController.updateUser(userData.id, { email_verified: true });
      toast.success('Email verificado manualmente');
      await loadUserData();
    } catch (error: any) {
      toast.error('Error al verificar email');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userData) return;
    
    setIsUpdating(true);
    try {
      await UserController.deleteUser(userData.id);
      toast.success('Usuario eliminado permanentemente');
      router.push('/admin/users');
    } catch (error: any) {
      if (error.response?.data?.error === 'CANNOT_DELETE_ADMIN') {
        toast.error('No puedes eliminar administradores');
      } else if (error.response?.data?.error === 'CANNOT_DELETE_SELF') {
        toast.error('No puedes eliminarte a ti mismo');
      } else {
        toast.error('Error al eliminar usuario');
      }
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (!userData) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">No se pudo cargar el usuario</p>
            <Button onClick={() => router.push('/admin/users')} className="mt-4">
              Volver a la Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/users')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-zinc-500">
            {UserController.formatUserName(userData.full_name)}
          </h1>
          <p className="text-muted-foreground mt-1">
            Detalles completos del usuario y estadísticas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={userData.is_active ? "destructive" : "default"}
            onClick={handleToggleActive}
            disabled={isUpdating}
          >
            {userData.is_active ? (
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
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.total_orders}</div>
            <p className="text-xs text-muted-foreground">Órdenes realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {UserController.formatTotalSpent(userData.total_spent)}
            </div>
            <p className="text-xs text-muted-foreground">En todas sus órdenes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direcciones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.total_addresses}</div>
            <p className="text-xs text-muted-foreground">Guardadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembro Desde</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {formatDate(userData.created_at)}
            </div>
            <p className="text-xs text-muted-foreground">Fecha de registro</p>
          </CardContent>
        </Card>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>Detalles de la cuenta del usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Nombre Completo</label>
              <p className="font-medium">{UserController.formatUserName(userData.full_name)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Correo Electrónico</label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{userData.email}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Estado</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={UserController.getUserStatusBadgeVariant(userData.is_active)}>
                  {UserController.getUserStatusLabel(userData.is_active)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Rol</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={UserController.getRoleBadgeVariant(userData.is_admin)}>
                  {UserController.getRoleLabel(userData.is_admin)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Verificación de Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={UserController.getVerifiedBadgeVariant(userData.email_verified)}>
                  {userData.email_verified ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {UserController.getVerifiedLabel(userData.email_verified)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Fecha de Registro</label>
              <p className="font-medium">
                {UserController.formatUserDate(userData.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones de Administración */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones de Administración</CardTitle>
          <CardDescription>Gestiona los permisos y estado de este usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={userData.is_admin ? "destructive" : "default"}
              onClick={handleToggleAdmin}
              disabled={isUpdating}
            >
              {userData.is_admin ? (
                <>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Quitar Permisos de Admin
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Promover a Administrador
                </>
              )}
            </Button>

            {!userData.email_verified && (
              <Button
                variant="outline"
                onClick={handleVerifyEmail}
                disabled={isUpdating}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verificar Email Manualmente
              </Button>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zona Peligrosa
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Esta acción eliminará permanentemente al usuario y no se puede deshacer.
              Se recomienda desactivar en su lugar.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isUpdating}>
                  Eliminar Usuario Permanentemente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    ⚠️ ¿Eliminar usuario permanentemente?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Esta acción es IRREVERSIBLE. ¿Estás seguro de que deseas eliminar 
                      permanentemente a <strong>{userData.full_name}</strong>?
                    </p>
                    <p className="font-semibold text-destructive">
                      Se recomienda usar "Desactivar" en su lugar.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteUser}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      'Sí, Eliminar Permanentemente'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Órdenes Recientes */}
      {userData.recent_orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Órdenes Recientes
            </CardTitle>
            <CardDescription>Últimas 5 órdenes realizadas por este usuario</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Orden</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userData.recent_orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="capitalize">{order.status}</TableCell>
                    <TableCell className="text-right font-medium">
                      {UserController.formatTotalSpent(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
