import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output — produces .next/standalone/server.js for the Docker image
  // (the Dockerfile copies it and the entrypoint runs `node server.js`).
  output: "standalone",

  // Pin the tracing root to this project — a stray lockfile in a parent
  // directory otherwise makes Next.js mis-detect the workspace root.
  outputFileTracingRoot: __dirname,

  // Enable React strict mode for catching bugs early
  reactStrictMode: true,

  experimental: {
    serverActions: {
      // Default is 1 MB — too small for product photo uploads
      // (admin uploads up to 8 files × 5 MB, see uploadProductImagesAction)
      bodySizeLimit: "45mb",
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  // Image optimization: allow our S3 bucket domain
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.S3_PUBLIC_HOSTNAME ?? "s3.selcdn.ru",
        pathname: "/furniture-shop-media/**",
      },
    ],
  },

  // Bundle only server-side packages on the server
  serverExternalPackages: ["pino", "pino-pretty"],

  // Disable powered-by header
  poweredByHeader: false,
};

export default nextConfig;
