import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bizearch | Your neighborhood, in reach",
    short_name: "Bizearch",
    description: "Find trusted local products and services from nearby businesses on Bizearch.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#00438b",
    icons: [
      {
        src: "/bizearch-square.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/bizearch-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/bizearch-square.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
