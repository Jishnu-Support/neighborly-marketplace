import type { Metadata, Viewport } from "next";
import BrandSplash from "./brand-splash";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#2b7744",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bizearch.co"),
  alternates: {
    canonical: "/",
  },
  title: "Bizearch | Your neighborhood, in reach",
  description:
    "Find trusted local products and services from nearby businesses on Bizearch - Hosur, Tamil Nadu and beyond.",
  applicationName: "Bizearch",
  authors: [{ name: "Bizearch" }],
  keywords: [
    "Bizearch",
    "Hosur marketplace",
    "heavy machinery Hosur",
    "SIPCOT industrial",
    "local business directory",
    "products and services",
    "automobiles",
    "electronics",
    "real estate Hosur",
  ],
  openGraph: {
    title: "Bizearch | Your neighborhood, in reach",
    description:
      "Find trusted local products and services from verified nearby businesses on Bizearch.",
    url: "https://bizearch.co",
    siteName: "Bizearch",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/bizearch-mark.svg",
        width: 512,
        height: 512,
        alt: "Bizearch Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Bizearch | Your neighborhood, in reach",
    description:
      "Find trusted local products and services from verified nearby businesses on Bizearch.",
    images: ["/bizearch-mark.svg"],
  },
  icons: {
    icon: "/bizearch-mark.svg",
    shortcut: "/bizearch-mark.svg",
    apple: "/bizearch-mark.svg",
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
