import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://bizearch.co";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/company-login"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
