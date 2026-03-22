/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  images: { remotePatterns: [{ hostname: "*.supabase.co" }] },
  // モノレポ環境でのワークスペースルート誤検出を防ぐ
  outputFileTracingRoot: path.join(__dirname, '../../'),
}

module.exports = nextConfig
