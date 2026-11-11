import type { NextConfig } from "next";
import { OPTIMIZABLE_IMAGE_HOSTS } from "./lib/image-hosts";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/uploads/:path*",
          destination: "/api/uploads/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  serverExternalPackages: ["better-sqlite3", "sharp", "nodemailer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: OPTIMIZABLE_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/**",
    })),
  },
};

export default nextConfig;
