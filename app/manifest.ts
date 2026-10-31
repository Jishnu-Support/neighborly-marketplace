import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bizearch | Your neighborhood, in reach",
    short_name: "Bizearch",
    description: "Find trusted local products and services from nearby businesses on Bizearch.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8f5",
    theme_color: "#2b7744",
    icons: [
      {
        src: "/bizearch-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/bizearch-mark.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
