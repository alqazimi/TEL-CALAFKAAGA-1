import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ClearStaleServiceWorkers } from "@/components/clear-stale-service-workers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="so" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased font-sans">
        {/* One-time cleanup for browsers that still have the old PWA worker */}
        <ClearStaleServiceWorkers />
        <SiteJsonLd />
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
