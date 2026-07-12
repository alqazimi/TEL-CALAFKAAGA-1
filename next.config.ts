import type { NextConfig } from "next";
import path from "node:path";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

const apiMode =
  (process.env.NEXT_PUBLIC_BACKEND_PROVIDER ?? "convex").toLowerCase() ===
  "api";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
    ],
  },
  webpack: (config, { webpack }) => {
    if (apiMode) {
      config.resolve = config.resolve ?? {};
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        "convex/react": path.join(
          __dirname,
          "src/data/shims/convex-react-stub.ts"
        ),
        "@convex-dev/auth/react": path.join(
          __dirname,
          "src/data/shims/convex-auth-stub.ts"
        ),
      };
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]convex[\\/]_generated[\\/]api(\.js|\.ts)?$/,
          path.join(__dirname, "src/data/shims/convex-api-stub.ts")
        )
      );
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/apple-icon",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
