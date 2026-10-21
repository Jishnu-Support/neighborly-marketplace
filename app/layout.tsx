import type { Metadata } from "next";
import BrandSplash from "./brand-splash";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neighborly — Your neighborhood, in reach",
  description:
    "Find trusted local products and services from nearby businesses on Neighborly.",
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
