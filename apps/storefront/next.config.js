/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@meghana/shared-types',
    '@meghana/shared-ui-components',
    '@meghana/shared-graphql-operations',
    '@meghana/shared-utils',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/shop-api/:path*',
        destination: `${process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000'}/shop-api/:path*`,
      },
      {
        source: '/admin-api/:path*',
        destination: `${process.env.VENDURE_ADMIN_API_URL || 'http://localhost:3000'}/admin-api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;