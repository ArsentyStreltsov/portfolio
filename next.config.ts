import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  serverExternalPackages: ["better-sqlite3"],
  async redirects() {
    return [
      { source: "/work", destination: "/#work", permanent: true },
      { source: "/work/:slug", destination: "/#work", permanent: true },
    ];
  },
};

export default nextConfig;
