/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Required for Docker
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig;
