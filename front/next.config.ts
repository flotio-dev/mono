import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure Next infers the correct workspace root (avoids picking up a parent lockfile)
};

export default nextConfig;
