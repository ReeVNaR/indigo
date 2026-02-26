import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Next.js 15+ turbopack root config
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
