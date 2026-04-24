import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: [
    '.space.z.ai',
    '.z.ai',
    'localhost',
  ],
};

export default nextConfig;
