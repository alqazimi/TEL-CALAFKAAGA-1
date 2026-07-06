import { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { HowItWorksContent } from "@/components/marketing/how-it-works-content";

export const metadata: Metadata = {
  title: "How it Works",
};

export default function HowItWorksPage() {
  return (
    <MarketingPage
      title="How it Works"
      subtitle="Your journey to finding a life partner, step by step."
    >
      <HowItWorksContent />
    </MarketingPage>
  );
}
