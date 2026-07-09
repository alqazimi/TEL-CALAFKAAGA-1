import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata("home", "/");

export default function HomePage() {
  return <LandingPage />;
}
