import type { Metadata, Viewport } from "next";
import BrandSplash from "./brand-splash";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#00438b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bizearch.in"),
  alternates: {
    canonical: "/",
  },
  title: "Bizearch | Your neighborhood, in reach",
  description:
    "Find trusted local products and services from verified nearby businesses on Bizearch - Discover local commerce across all cities in India.",
  applicationName: "Bizearch",
  authors: [{ name: "Bizearch" }],
  keywords: [
    "Bizearch",
    "India marketplace",
    "local business directory",
    "products and services",
    "automobiles",
    "electronics",
    "real estate",
    "heavy machinery",
    "local shops India",
  ],
  openGraph: {
    title: "Bizearch | Your neighborhood, in reach",
    description:
      "Find trusted local products and services from verified nearby businesses on Bizearch.",
    url: "https://bizearch.in",
    siteName: "Bizearch",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/bizearch-logo.png",
        width: 1024,
        height: 344,
        alt: "Bizearch.in - Find • Connect • Grow",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Bizearch | Your neighborhood, in reach",
    description:
      "Find trusted local products and services from verified nearby businesses on Bizearch.",
    images: ["/bizearch-logo.png"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/bizearch-square.png", sizes: "512x512", type: "image/png" },
      { url: "/bizearch-mark.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <BrandSplash />
        {children}
      </body>
    </html>
  );
}
