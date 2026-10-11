import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // 自宅サーバーで `node server.js` だけで起動できるようにする
  output: "standalone",
  // 起動時に適用するマイグレーションを成果物に含める
  outputFileTracingIncludes: {
    "/*": ["./drizzle/**/*"],
  },
  experimental: {
    serverActions: {
      // CSV の上限 10MB + multipart のオーバーヘッド
      bodySizeLimit: "11mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
