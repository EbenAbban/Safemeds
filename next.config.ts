import type { NextConfig } from "next";

let nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Tree-shakes barrel-style imports (icon/animation libraries in particular
  // re-export hundreds of modules from one entry point) so both dev compiles
  // and the production bundle only include what's actually imported.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // The worker must never be served from cache, or a stale copy can pin
        // users to an old caching policy indefinitely. Service-Worker-Allowed
        // lets a worker served from /sw.js control the whole origin.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

// Bundle analysis — run with `ANALYZE=true npx next build`
if (process.env.ANALYZE === "true") {
  try {
    const withBundleAnalyzer = require("@next/bundle-analyzer")({
      enabled: true,
    });
    nextConfig = withBundleAnalyzer(nextConfig);
  } catch {
    // @next/bundle-analyzer not installed — build silently falls through
  }
}

export default nextConfig;
