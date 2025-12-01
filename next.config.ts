import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Optimizaciones para producción
  compress: true,
  poweredByHeader: false,
  
  // Configuración de imágenes para desarrollo y producción
  images: {
    remotePatterns: [
      // Desarrollo local
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/products/**',
      },
      // Producción HTTPS
      {
        protocol: 'https',
        hostname: 'cisnaturatienda.com',
        pathname: '/static/products/**',
      },
      // Alternativa con www (si aplica)
      {
        protocol: 'https',
        hostname: 'www.cisnaturatienda.com',
        pathname: '/static/products/**',
      },
      // Google User Profile Images
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
    ],
    // Formatos modernos
    formats: ['image/avif', 'image/webp'],
    // Tamaños permitidos para optimización
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers de seguridad para producción
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
