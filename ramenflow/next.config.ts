import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 画像の外部ドメイン（Supabase Storage）を許可
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
