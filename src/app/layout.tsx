import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import {
  APP_NAME,
  APP_DESCRIPTION,
  PRODUCTION_SITE_URL,
  SITE_BRAND_NAME,
} from "@/lib/constants";
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

export const metadata: Metadata = {
  applicationName: SITE_BRAND_NAME,
  title: {
    default: `${APP_NAME} — Islamic Matchmaking Service`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "halal",
    "marriage",
    "matchmaking",
    "muslim",
    "islamic",
    "hel calafkaaga",
    "hel calafkaaga matchmaking",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_SITE_URL
  ),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["so_SO"],
    url: "/",
    siteName: SITE_BRAND_NAME,
    title: `${APP_NAME} — Islamic Matchmaking Service`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_BRAND_NAME} — Islamic Matchmaking`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Islamic Matchmaking Service`,
    description: APP_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: SITE_BRAND_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="so" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
