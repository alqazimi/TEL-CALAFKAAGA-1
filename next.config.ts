import type { NextConfig } from "next";
import type { Configuration as WebpackConfig } from "webpack";
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

const convexPkg = path.join(__dirname, "node_modules/convex");
const convexReactStub = path.join(
  __dirname,
  "src/data/shims/convex-react-stub.ts"
);
const convexAuthStub = path.join(
  __dirname,
  "src/data/shims/convex-auth-stub.ts"
);
const convexApiStub = path.join(__dirname, "src/data/shims/convex-api-stub.ts");

/** Next may use alias arrays — merge without replacing the whole field. */
function mergeWebpackAliases(
  config: WebpackConfig,
  aliases: Record<string, string>
): void {
  config.resolve = config.resolve ?? {};
  const current = config.resolve.alias;
  if (Array.isArray(current)) {
    for (const [name, alias] of Object.entries(aliases)) {
      current.push({ name, alias, onlyModule: false });
    }
    return;
  }
  config.resolve.alias = {
    ...(typeof current === "object" && current ? current : {}),
    ...aliases,
  };
}

const webpackAliases: Record<string, string> = {
  convex: convexPkg,
  ...(apiMode
    ? {
        "convex/react": convexReactStub,
        "@convex-dev/auth/react": convexAuthStub,
        "convex/_generated/api": convexApiStub,
      }
    : {}),
};

// Turbopack requires project-relative alias targets (not absolute paths).
const turbopackAliases: Record<string, string> = {
  convex: "./node_modules/convex",
  ...(apiMode
    ? {
        "convex/react": "./src/data/shims/convex-react-stub.ts",
        "@convex-dev/auth/react": "./src/data/shims/convex-auth-stub.ts",
        "convex/_generated/api": "./src/data/shims/convex-api-stub.ts",
      }
    : {}),
};

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
  // Dev uses Turbopack (Tailwind v4 `@import "tailwindcss"`). Production build uses webpack.
  turbopack: {
    resolveAlias: turbopackAliases,
  },
  webpack: (config, { webpack }) => {
    mergeWebpackAliases(config, webpackAliases);

    if (apiMode) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]convex[\\/]_generated[\\/]api(\.js|\.ts)?$/,
          convexApiStub
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
