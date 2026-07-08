import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import {
  APP_DESCRIPTION,
  APP_NAME,
  PRODUCTION_SITE_URL,
  SITE_BRAND_NAME,
} from "@/lib/constants";

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_SITE_URL
).replace(/\/$/, "");

export const metadata: Metadata = {
  title: `${APP_NAME} — Islamic Matchmaking Service`,
  description: APP_DESCRIPTION,
  alternates: {
    canonical: `${siteUrl}/`,
  },
  openGraph: {
    url: `${siteUrl}/`,
    siteName: SITE_BRAND_NAME,
    title: `${APP_NAME} — Islamic Matchmaking Service`,
    description: APP_DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    <>
      <SiteJsonLd />
      <LandingPage />
    </>
  );
}
