import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@thrivelife/shared"],
  // Prefer this repo's lockfile over any lockfile higher in the filesystem.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
