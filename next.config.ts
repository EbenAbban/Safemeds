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
