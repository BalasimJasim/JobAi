import type { NextConfig } from "next";

// Log the configuration for debugging
console.log('Starting Next.js with configuration:');
console.log('API Proxy Target: http://localhost:5000/api/');

const nextConfig: NextConfig = {
  async rewrites() {
    console.log('Setting up rewrites to proxy API requests');
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
        basePath: false,
      },
    ];
  },
  async headers() {
    console.log('Setting up CORS headers');
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD-5, Content-Type, Date, X-Api-Version, X-XSRF-TOKEN, Authorization' },
        ],
      },
    ];
  },
  hostname: '0.0.0.0',
  port: 3000,
};

export default nextConfig;
