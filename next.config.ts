import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Keep verification builds isolated from a running local dev server. */
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
