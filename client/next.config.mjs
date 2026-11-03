/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: false,
  experimental: {
    webpackBuildWorker: false,
  },
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'X-Frame-Options', value: 'ALLOWALL' }] }];
  },
  async redirects() {
    return [
      {
        source: '/kid/:path*',
        destination: '/child/:path*',
        permanent: true,
      },
      {
        source: '/kid',
        destination: '/child',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
