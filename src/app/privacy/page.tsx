import { Metadata } from "next";
import { PrivacyPageContent } from "@/components/marketing/privacy-page-content";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("privacy", "/privacy");

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
