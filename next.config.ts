import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.1.3", "129.121.171.41"],
  output: "standalone",
};

export default nextConfig;
