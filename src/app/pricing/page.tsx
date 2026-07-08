import { Metadata } from "next";
import { PricingPageContent } from "@/components/marketing/pricing-page-content";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Calaf registration: $10 standard or $20 with personal relationship support. One-time payment, full access to halal matchmaking.",
};

export default function PricingPage() {
  return <PricingPageContent />;
}
