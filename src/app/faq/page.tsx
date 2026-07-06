import { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { FAQAccordion } from "@/components/marketing/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FAQPage() {
  return (
    <MarketingPage
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about Calaf."
    >
      <FAQAccordion />
    </MarketingPage>
  );
}
