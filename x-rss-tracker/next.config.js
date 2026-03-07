/** @type {import('next').NextConfig} */
const nextConfig = {
  // Instrumentation Hook でCronを初期化するために必要
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
