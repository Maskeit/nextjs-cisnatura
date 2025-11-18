import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const protectedRoutes = [
  '/carrito',
  '/domicilio',
  '/orden-summary',
  '/resumen-compra',
  '/perfil',
  '/mis-pedidos',
];

// Rutas solo para administradores
const adminRoutes = ['/admin'];

// Rutas solo para usuarios no autenticados
const authRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Obtener el token y datos de usuario de las cookies
  const token = request.cookies.get('access_token')?.value;
  const userDataCookie = request.cookies.get('user_data')?.value;
  const isAuthenticated = !!token;
  
  // Parsear datos del usuario para verificar rol de admin
  let isAdmin = false;
  if (userDataCookie) {
    try {
      const userData = JSON.parse(userDataCookie);
      isAdmin = userData.is_admin === true;
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  // Si está en una ruta de admin
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    // No autenticado -> redirigir a login
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Autenticado pero no es admin -> redirigir a home
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Si está en una ruta protegida y no está autenticado
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Si está en una ruta de auth (login/register) y ya está autenticado
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configuración para que el middleware se ejecute solo en rutas específicas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
