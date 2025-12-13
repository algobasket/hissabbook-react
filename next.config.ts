import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Reduce memory usage
  experimental: {
    optimizeCss: true,
  },
  
  // Note: Removed webpack config - Next.js 16 uses Turbopack by default
  // Turbopack automatically handles code splitting and optimizations
  // If you need webpack-specific config, use: npm run build -- --webpack
};

export default nextConfig;
