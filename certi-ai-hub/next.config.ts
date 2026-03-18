import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: { typedRoutes: false },
  images: { remotePatterns: [{ hostname: "*.supabase.co" }] },
}

export default nextConfig
