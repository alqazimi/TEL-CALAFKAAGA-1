import { Metadata } from "next";
import { FaqPageContent } from "@/components/marketing/faq-page-content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about Calaf — halal matchmaking, pricing ($15 standard or $20 with personal support), privacy, and how matching works.",
};

export default function FAQPage() {
  return <FaqPageContent />;
}
