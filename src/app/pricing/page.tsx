import { Metadata } from "next";
import { PricingPageContent } from "@/components/marketing/pricing-page-content";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return <PricingPageContent />;
}
