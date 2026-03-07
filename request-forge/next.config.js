/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  // Stripe WebhookのrawBodyを取得するためEdge RuntimeをAPI Routesから除外
  serverExternalPackages: ["@prisma/client", "bcrypt"],
};

module.exports = nextConfig;
