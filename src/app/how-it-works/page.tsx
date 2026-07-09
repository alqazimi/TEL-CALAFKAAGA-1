import { Metadata } from "next";
import { HowItWorksPageContent } from "@/components/marketing/how-it-works-page-content";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("howItWorks", "/how-it-works");

export default function HowItWorksPage() {
  return <HowItWorksPageContent />;
}
