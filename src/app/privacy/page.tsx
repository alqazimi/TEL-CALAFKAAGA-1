import { Metadata } from "next";
import { PrivacyPageContent } from "@/components/marketing/privacy-page-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Hel Calafkaaga collects, uses, and protects your personal data on our halal matchmaking platform.",
};

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
