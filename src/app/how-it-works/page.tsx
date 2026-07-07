import { Metadata } from "next";
import { HowItWorksPageContent } from "@/components/marketing/how-it-works-page-content";

export const metadata: Metadata = {
  title: "How it Works",
};

export default function HowItWorksPage() {
  return <HowItWorksPageContent />;
}
