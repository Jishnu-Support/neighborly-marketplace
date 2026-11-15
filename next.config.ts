import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.1.3", "129.121.171.41"],
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|ico|woff|woff2|ttf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/ads",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=30, stale-while-revalidate=120",
          },
        ],
      },
      {
        source: "/api/category-config",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
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
