import { Metadata } from "next";
import { HowItWorksPageContent } from "@/components/marketing/how-it-works-page-content";

export const metadata: Metadata = {
  title: "How it Works",
  description:
    "Register, complete your profile, discover compatible matches, and connect respectfully on Hel Calafkaaga.",
};

export default function HowItWorksPage() {
  return <HowItWorksPageContent />;
}
