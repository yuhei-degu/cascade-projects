import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
  images: { remotePatterns: [{ hostname: "*.supabase.co" }] },
}

export default nextConfig
