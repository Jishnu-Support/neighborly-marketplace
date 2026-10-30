import type { Metadata } from "next";
import BrandSplash from "./brand-splash";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bizearch.co"),
  alternates: {
    canonical: "/",
  },
  title: "Bizearch | Your neighborhood, in reach",
  description:
    "Find trusted local products and services from nearby businesses on Bizearch.",
  icons: {
    icon: "/bizearch-mark.svg",
    shortcut: "/bizearch-mark.svg",
  },
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
