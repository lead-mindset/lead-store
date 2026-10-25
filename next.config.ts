import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // A package-lock.json in the home folder otherwise makes Turbopack guess the wrong workspace root.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
