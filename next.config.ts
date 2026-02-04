import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ['pino', 'thread-stream'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    viewTransition: true,
    ...(isDevelopment ? { serverComponentsHmrCache: false } : {}),
  },
  reactCompiler: true,
  // Suppress verbose Turbopack output
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security Headers for ISO 27001 compliance
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
