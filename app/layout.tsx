import type { Metadata } from "next";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
