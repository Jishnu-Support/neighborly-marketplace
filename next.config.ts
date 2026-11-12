import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.1.3", "129.121.171.41"],
  async redirects() {
    return [
      {
        source: "/bizearch-all-122-businesses-and-common-places.xlsx",
        destination: "/api/company/businesses/export?format=xlsx",
        permanent: false,
      },
      {
        source: "/bizearch-all-122-businesses-and-common-places.csv",
        destination: "/api/company/businesses/export?format=csv",
        permanent: false,
      },
      {
        source: "/bizearch-verified-phones-122-records.xlsx",
        destination: "/api/company/businesses/export?format=xlsx",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
