/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      },
      {
        source: '/ws',
        destination: `${backendUrl.replace('http', 'ws')}/ws`
      }
    ];
  }
};

module.exports = nextConfig;
