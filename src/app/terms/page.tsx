import { Metadata } from "next";
import { TermsPageContent } from "@/components/marketing/terms-page-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for using Hel Calafkaaga — halal Islamic matchmaking, registration, and member conduct.",
};

export default function TermsPage() {
  return <TermsPageContent />;
}
