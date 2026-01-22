/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // OpenNext for Cloudflare requires standalone output
  output: 'standalone',
};

export default nextConfig;
