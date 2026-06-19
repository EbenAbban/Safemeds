import type { NextConfig } from "next";

let nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
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
