import type { MetadataRoute } from "next";
import { defaultCategoryConfig } from "./lib/category-config.shared";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://bizearch.co";
  const now = new Date();

  // Primary platform routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Category sectors
  for (const sector of defaultCategoryConfig.sectors) {
    const slug = encodeURIComponent(sector.name.toLowerCase().replace(/\s+/g, "-"));
    routes.push({
      url: `${baseUrl}/?category=${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return routes;
}
