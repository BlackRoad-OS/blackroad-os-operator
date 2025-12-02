import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enable React 19 features
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blackroad.io',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.blackroad.io/v1',
  },
};

export default nextConfig;
