"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import UserController from '@/lib/UserController';
import type { UserProfileSummary } from '@/interfaces/User';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  MapPin, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Package,
  Settings,
  LogOut,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function PerfilContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {    
    // Redirigir si no está autenticado
    if (!authLoading && !isAuthenticated) {
      toast.info('Inicia sesión para ver tu perfil');
      router.push('/login');
      return;
    }

    // Evitar llamada duplicada en desarrollo (Strict Mode)
    if (isAuthenticated && !hasLoadedRef.current) {      
      hasLoadedRef.current = true;
      loadProfileData();
    }
  }, [isAuthenticated, authLoading]);

  const loadProfileData = async () => {
    try {
      const response = await UserController.getMyProfileSummary();
      setProfileData(response.data);
    } catch (error: any) {
      console.error('Error al cargar perfil:', error);
      
      if (error.response?.status === 401 || error.response?.data?.error === 'AUTHENTICATION_REQUIRED') {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente');
        router.push('/login');
      } else {
        toast.error('Error al cargar tu perfil');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profileData) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No se pudo cargar tu perfil</p>
            <Button onClick={loadProfileData} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, total_orders, completed_orders, pending_orders, total_spent, total_addresses, last_order } = profileData;

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-500">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu información personal y visualiza tu actividad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/perfil/editar')}>
            <Settings className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Información del Usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Nombre Completo</label>
              <p className="font-medium">{profile.full_name}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Correo Electrónico</label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Estado de Verificación</label>
              <div className="flex items-center gap-2">
                {profile.email_verified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Email Verificado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600 font-medium">Email No Verificado</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Miembro Desde</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {UserController.formatUserDate(profile.created_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total_orders}</div>
            <p className="text-xs text-muted-foreground">
              {completed_orders} completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending_orders}</div>
            <p className="text-xs text-muted-foreground">
              En proceso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {UserController.formatTotalSpent(total_spent)}
            </div>
            <p className="text-xs text-muted-foreground">
              En todas tus órdenes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direcciones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total_addresses}</div>
            <p className="text-xs text-muted-foreground">
              Guardadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Última Orden */}
      {last_order && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Última Orden
            </CardTitle>
            <CardDescription>Tu pedido más reciente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Orden #{last_order.id}</p>
                <p className="text-sm text-muted-foreground">
                  {UserController.formatUserDate(last_order.created_at)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-bold text-lg">
                  {UserController.formatTotalSpent(last_order.total)}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {last_order.status}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/perfil/mis-ordenes')} 
              className="w-full mt-4"
              variant="outline"
            >
              Ver Todas Mis Órdenes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede rápidamente a tus opciones</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/perfil/mis-ordenes')}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Mis Órdenes
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/domicilio')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Mis Direcciones
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/perfil/editar')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Cambiar Contraseña
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => router.push('/')}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Seguir Comprando
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
